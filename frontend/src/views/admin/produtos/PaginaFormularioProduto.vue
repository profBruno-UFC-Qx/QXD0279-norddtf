<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowReactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFieldArray, useForm, type Path } from 'vee-validate'

import { listarCategorias } from '@/api/categorias'
import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import { cadastrarProduto, detalharProduto, editarProduto } from '@/api/produtos'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCarregando from '@/components/base/BaseCarregando.vue'
import BaseMensagem from '@/components/base/BaseMensagem.vue'
import BaseModalConfirmacao from '@/components/base/BaseModalConfirmacao.vue'
import IconeVoltar from '@/components/icones/IconeVoltar.vue'
import { useAvisos } from '@/stores/avisos'
import type { Categoria } from '@/types/categoria'
import {
  TAMANHOS,
  type CampoDeImagem,
  type ProdutoDetalhado,
  type TipoProduto,
} from '@/types/produto'
import { aplicarErrosDaApi, schemaZod } from '@/utils/validacao'
import type { ModoDaCor } from './CardCor.vue'
import {
  CAMPOS_DE_IMAGEM,
  IMAGENS_POR_TIPO,
  corDoDetalhe,
  criarEsquemaProduto,
  errosNoFormulario,
  linhaDoDetalhe,
  montarCorpo,
  montarCorpoDaEdicao,
  valoresDoDetalhe,
  type CorDoFormulario,
  type LinhaDeEstoque,
  type ValoresDoProduto,
} from './esquemaProduto'
import ProdutoNaoEncontrado from './ProdutoNaoEncontrado.vue'
import SecaoCores from './SecaoCores.vue'
import SecaoEstoque from './SecaoEstoque.vue'
import SecaoInformacoes from './SecaoInformacoes.vue'
import SecaoTipo from './SecaoTipo.vue'
import { useEnvioDeImagem } from './useEnvioDeImagem'

const MENSAGEM_DE_COR_VENDIDA = 'Esta cor já foi vendida e não pode ser removida.'

const route = useRoute()
const router = useRouter()
const avisos = useAvisos()
const envio = useEnvioDeImagem()

const modos = shallowReactive(new Map<string, ModoDaCor>())
const copias = shallowReactive(new Map<string, CorDoFormulario>())
const comErrosVisiveis = shallowReactive(new Set<string>())
const coresVendidas = shallowReactive(new Set<string>())
const avisosDeVenda = shallowReactive(new Set<string>())
const coresSalvas = new Set<string>()
const vendido = ref(false)
let proximaCor = 0
let desmontado = false

function modoDe(cor: Pick<CorDoFormulario, 'idLocal'>): ModoDaCor {
  return modos.get(cor.idLocal) ?? 'salva'
}

const valoresIniciais: ValoresDoProduto = {
  tipo: 'PERSONALIZAVEL',
  nome: '',
  preco: '',
  descricao: '',
  categorias: [],
  temTamanho: true,
  cores: [],
  estoque: [],
}

const {
  values,
  errors,
  submitCount,
  handleSubmit,
  resetForm,
  setErrors,
  setFieldValue,
  validate,
  validateField,
} = useForm<ValoresDoProduto>({
  validationSchema: schemaZod(
    criarEsquemaProduto((cor) => !cor.idLocal || modoDe({ idLocal: cor.idLocal }) !== 'salva'),
  ),
  initialValues: valoresIniciais,
  keepValuesOnUnmount: true,
})

const {
  push: incluirCor,
  insert: inserirCor,
  remove: tirarCor,
  update: atualizarCor,
} = useFieldArray<CorDoFormulario>('cores')
const {
  fields: camposDoEstoque,
  push: incluirLinha,
  insert: inserirLinha,
  remove: tirarLinha,
  update: atualizarLinha,
} = useFieldArray<LinhaDeEstoque>('estoque')

const tentou = computed(() => submitCount.value > 0)

const edicao = computed(() => route.name === 'admin-produto-editar')

function idDaRota() {
  return String(route.params.id)
}

function naoEncontrado(erro: unknown) {
  return erro instanceof ErroApi && erro.codigo === 'PRODUTO_NAO_ENCONTRADO'
}

const categorias = ref<Categoria[]>([])
const estado = ref<'carregando' | 'erro' | 'nao-encontrado' | 'pronta'>('carregando')
let controladorDaCarga: AbortController | undefined
let controladorDasCategorias: AbortController | undefined

async function carregar() {
  controladorDaCarga?.abort()
  controladorDasCategorias?.abort()
  controladorDaCarga = new AbortController()
  const { signal } = controladorDaCarga
  const id = edicao.value ? idDaRota() : undefined
  estado.value = 'carregando'
  try {
    const [lista, produto] = await Promise.all([
      listarCategorias(signal),
      id ? detalharProduto(id, signal) : undefined,
    ])
    categorias.value = lista
    preencher(produto)
    estado.value = 'pronta'
  } catch (erro) {
    if (signal.aborted) return
    estado.value = naoEncontrado(erro) ? 'nao-encontrado' : 'erro'
  }
}

async function recarregarCategorias() {
  controladorDasCategorias?.abort()
  controladorDasCategorias = new AbortController()
  const lista = await listarCategorias(controladorDasCategorias.signal).catch(() => undefined)
  if (lista) categorias.value = lista
}

function indiceDaCor(idLocal: string) {
  return values.cores.findIndex((cor) => cor.idLocal === idLocal)
}

function indiceDaLinha(idLocal: string) {
  return values.estoque.findIndex((linha) => linha.cor === idLocal)
}

const temCorNova = computed(() => values.cores.some((cor) => modoDe(cor) === 'nova'))

function adicionarCor() {
  proximaCor += 1
  const idLocal = `cor-${proximaCor}`
  modos.set(idLocal, 'nova')
  incluirCor({
    idLocal,
    nome: '',
    hex: '',
    imagemApresentacao: null,
    imagemApresentacaoCostas: null,
    imagemPersonalizacaoFrente: null,
    imagemPersonalizacaoCostas: null,
  })
}

async function confirmarCor(idLocal: string) {
  const indice = indiceDaCor(idLocal)
  if (indice === -1) return
  comErrosVisiveis.add(idLocal)
  if (envio.enviandoNaCor(idLocal)) return
  const caminhos = ['nome', 'hex', ...CAMPOS_DE_IMAGEM].map((campo) => `cores[${indice}].${campo}`)
  const resultados = await Promise.all(
    caminhos.map((caminho) => validateField(caminho as Path<ValoresDoProduto>)),
  )
  if (indiceDaCor(idLocal) !== indice || resultados.some((resultado) => !resultado.valid)) return
  modos.set(idLocal, 'salva')
  copias.delete(idLocal)
  envio.descartarCor(idLocal)
  await validate({ mode: 'silent' })
}

function editarCor(idLocal: string) {
  const cor = values.cores[indiceDaCor(idLocal)]
  if (!cor) return
  copias.set(idLocal, { ...cor })
  modos.set(idLocal, 'edicao')
}

function removerCor(idLocal: string) {
  const indice = indiceDaCor(idLocal)
  if (indice === -1) return
  envio.descartarCor(idLocal)
  const linha = indiceDaLinha(idLocal)
  if (linha !== -1) tirarLinha(linha)
  tirarCor(indice)
  modos.delete(idLocal)
  copias.delete(idLocal)
  comErrosVisiveis.delete(idLocal)
}

function pedirRemocaoDaCor(idLocal: string) {
  if (coresVendidas.has(idLocal)) {
    avisosDeVenda.add(idLocal)
    return
  }
  removerCor(idLocal)
}

function descartarCor(idLocal: string) {
  const copia = copias.get(idLocal)
  const indice = indiceDaCor(idLocal)
  if (!copia || indice === -1) {
    removerCor(idLocal)
    return
  }
  envio.descartarCor(idLocal)
  atualizarCor(indice, copia)
  modos.set(idLocal, 'salva')
  copias.delete(idLocal)
}

function escolherImagem(idLocal: string, campo: CampoDeImagem, arquivo: File) {
  envio.enviar(idLocal, campo, arquivo, (imagem) => {
    const indice = indiceDaCor(idLocal)
    const cor = values.cores[indice]
    if (!cor || !IMAGENS_POR_TIPO[values.tipo].some((quadro) => quadro.campo === campo)) return
    atualizarCor(indice, { ...cor, [campo]: imagem })
  })
}

function tituloDe(cor: CorDoFormulario) {
  const modo = modoDe(cor)
  if (modo === 'nova') return 'Nova cor'
  if (modo === 'edicao') return copias.get(cor.idLocal)?.nome ?? cor.nome
  return cor.nome
}

const tipoAplicado = ref<TipoProduto>(valoresIniciais.tipo)
const tipoPendente = ref<TipoProduto>()

const confirmacaoDeTipoAberta = computed({
  get: () => tipoPendente.value !== undefined,
  set: (aberta: boolean) => {
    if (!aberta) tipoPendente.value = undefined
  },
})

function corPreenchida(cor: CorDoFormulario) {
  if (cor.nome.trim() || cor.hex) return true
  return CAMPOS_DE_IMAGEM.some((campo) => cor[campo]) || envio.enviandoNaCor(cor.idLocal)
}

function aplicarTipo(tipo: TipoProduto) {
  tipoAplicado.value = tipo
  setFieldValue('tipo', tipo, false)
  const usados = new Set(IMAGENS_POR_TIPO[tipo].map((quadro) => quadro.campo))
  const descartados = CAMPOS_DE_IMAGEM.filter((campo) => !usados.has(campo))
  for (const [idLocal, copia] of copias) {
    if (!descartados.some((campo) => copia[campo])) continue
    const limpa = { ...copia }
    for (const campo of descartados) limpa[campo] = null
    copias.set(idLocal, limpa)
  }
  values.cores.forEach((cor, indice) => {
    for (const campo of descartados) envio.descartarQuadro(cor.idLocal, campo)
    if (!descartados.some((campo) => cor[campo])) return
    const limpa = { ...cor }
    for (const campo of descartados) limpa[campo] = null
    atualizarCor(indice, limpa)
  })
}

watch(
  () => values.tipo,
  (tipo) => {
    if (tipo === tipoAplicado.value) return
    if (!values.cores.some(corPreenchida)) {
      aplicarTipo(tipo)
      return
    }
    tipoPendente.value = tipo
    nextTick(() => setFieldValue('tipo', tipoAplicado.value, false))
  },
)

function confirmarTipo() {
  if (tipoPendente.value) aplicarTipo(tipoPendente.value)
  tipoPendente.value = undefined
}

const tamanhoPendente = ref<boolean>()

const confirmacaoDeTamanhoAberta = computed({
  get: () => tamanhoPendente.value !== undefined,
  set: (aberta: boolean) => {
    if (!aberta) tamanhoPendente.value = undefined
  },
})

function quantidadesZeradas(temTamanho: boolean) {
  return Array<number | null>(temTamanho ? TAMANHOS.length : 1).fill(0)
}

function aplicarTamanho(temTamanho: boolean) {
  setFieldValue('temTamanho', temTamanho, false)
  values.estoque.forEach((linha, indice) =>
    atualizarLinha(indice, { cor: linha.cor, quantidades: quantidadesZeradas(temTamanho) }),
  )
}

function mudarTamanho(temTamanho: boolean) {
  const preenchido = values.estoque.some((linha) =>
    linha.quantidades.some((quantidade) => quantidade !== null && quantidade > 0),
  )
  if (preenchido) {
    tamanhoPendente.value = temTamanho
    return
  }
  aplicarTamanho(temTamanho)
}

function confirmarTamanho() {
  if (tamanhoPendente.value !== undefined) aplicarTamanho(tamanhoPendente.value)
  tamanhoPendente.value = undefined
}

const coresDoEstoque = computed(() => values.cores.filter((cor) => modoDe(cor) !== 'nova'))

const linhas = computed(() =>
  camposDoEstoque.value.flatMap((campo, indice) => {
    const linha = values.estoque[indice]
    return linha ? [{ chave: campo.key, linha }] : []
  }),
)

function adicionarLinha() {
  const cor = coresDoEstoque.value.find((candidata) => indiceDaLinha(candidata.idLocal) === -1)
  if (!cor) return
  incluirLinha({ cor: cor.idLocal, quantidades: quantidadesZeradas(values.temTamanho) })
}

function trocarCorDaLinha(indice: number, cor: string) {
  const linha = values.estoque[indice]
  if (!linha || indiceDaLinha(cor) !== -1) return
  atualizarLinha(indice, { cor, quantidades: [...linha.quantidades] })
}

function mudarQuantidade(indice: number, posicao: number, quantidade: number | null) {
  const linha = values.estoque[indice]
  if (!linha) return
  const quantidades = [...linha.quantidades]
  quantidades[posicao] = quantidade
  atualizarLinha(indice, { cor: linha.cor, quantidades })
}

const processando = ref(false)
const salvo = ref(false)
const erroDoEnvio = ref<string>()

function aplicarVenda(produto: ProdutoDetalhado) {
  vendido.value = produto.vendido
  if (produto.vendido && produto.temTamanho !== values.temTamanho) {
    setFieldValue('temTamanho', produto.temTamanho, false)
    values.estoque.forEach((linha, indice) => {
      const salva = produto.cores.find((cor) => cor.id === linha.cor)
      atualizarLinha(
        indice,
        salva
          ? linhaDoDetalhe(salva, produto.temTamanho)
          : { cor: linha.cor, quantidades: quantidadesZeradas(produto.temTamanho) },
      )
    })
  }
  produto.cores.forEach((cor, posicao) => {
    if (!cor.vendida) return
    coresVendidas.add(cor.id)
    if (indiceDaCor(cor.id) !== -1) return
    coresSalvas.add(cor.id)
    avisosDeVenda.add(cor.id)
    const seguintes = new Set(produto.cores.slice(posicao + 1).map((seguinte) => seguinte.id))
    const cores = values.cores.map((atual) => atual.idLocal)
    inserirCor(posicaoAntesDe(cores, seguintes), corDoDetalhe(cor))
    if (indiceDaLinha(cor.id) !== -1) return
    const linhas = values.estoque.map((linha) => linha.cor)
    inserirLinha(posicaoAntesDe(linhas, seguintes), linhaDoDetalhe(cor, produto.temTamanho))
  })
}

function posicaoAntesDe(ids: string[], seguintes: ReadonlySet<string>) {
  const indice = ids.findIndex((id) => seguintes.has(id))
  if (indice !== -1) return indice
  const ultimaSalva = ids.findLastIndex((id) => coresSalvas.has(id))
  return ultimaSalva + 1
}

async function tratarVendaNoMeio(erro: ErroApi, id: string) {
  avisos.erro(erro.mensagem)
  let produto: ProdutoDetalhado
  try {
    produto = await detalharProduto(id)
  } catch (falha) {
    if (!desmontado && idDaRota() === id && naoEncontrado(falha)) estado.value = 'nao-encontrado'
    return
  }
  if (!desmontado && idDaRota() === id) aplicarVenda(produto)
}

async function tratarErroDoEnvio(erro: unknown, enviados: ValoresDoProduto, id?: string) {
  if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) return
  if (id && naoEncontrado(erro)) {
    estado.value = 'nao-encontrado'
    return
  }
  if (
    id &&
    erro instanceof ErroApi &&
    (erro.codigo === 'COR_VENDIDA' || erro.codigo === 'OPCAO_DE_TAMANHO_BLOQUEADA')
  ) {
    await tratarVendaNoMeio(erro, id)
    return
  }
  const aplicados = aplicarErrosDaApi(erro, (erros) =>
    setErrors(errosNoFormulario(erros, enviados, values)),
  )
  if (!aplicados) {
    erroDoEnvio.value = MENSAGEM_GERAL
    return
  }
  if (erro instanceof ErroApi && erro.erros?.categorias) {
    await recarregarCategorias()
    const existentes = new Set(categorias.value.map((categoria) => categoria.id))
    setFieldValue(
      'categorias',
      values.categorias.filter((id) => existentes.has(id)),
      false,
    )
  }
}

function gravar(valores: ValoresDoProduto, id?: string) {
  if (id) return editarProduto(id, montarCorpoDaEdicao(valores, coresSalvas))
  return cadastrarProduto(montarCorpo(valores))
}

const enviar = handleSubmit(async (valores) => {
  if (values.cores.some((cor) => modoDe(cor) !== 'salva')) return
  const enviados = valores as ValoresDoProduto
  const id = edicao.value ? idDaRota() : undefined
  let produto
  try {
    produto = await gravar(enviados, id)
  } catch (erro) {
    if (!desmontado && (!id || idDaRota() === id)) await tratarErroDoEnvio(erro, enviados, id)
    return
  }
  salvo.value = true
  avisos.sucesso(id ? 'Produto atualizado.' : 'Produto cadastrado.')
  if (!desmontado) await router.replace({ name: 'admin-produto', params: { id: produto.id } })
})

async function salvar() {
  if (processando.value || salvo.value || envio.enviando.value) return
  processando.value = true
  erroDoEnvio.value = undefined
  for (const cor of values.cores) comErrosVisiveis.add(cor.idLocal)
  try {
    const abertas = values.cores.filter((cor) => modoDe(cor) !== 'salva')
    for (const { idLocal } of abertas) {
      if (!envio.comErroNaCor(idLocal)) await confirmarCor(idLocal)
    }
    await enviar()
  } finally {
    processando.value = false
  }
}

function irParaListagem() {
  router.push({ name: 'admin-produtos' })
}

function preencher(produto: ProdutoDetalhado | undefined) {
  envio.descartarTudo()
  for (const colecao of [modos, copias, comErrosVisiveis, coresVendidas, avisosDeVenda]) {
    colecao.clear()
  }
  coresSalvas.clear()
  tipoPendente.value = undefined
  tamanhoPendente.value = undefined
  erroDoEnvio.value = undefined
  salvo.value = false
  vendido.value = produto?.vendido ?? false
  for (const cor of produto?.cores ?? []) {
    coresSalvas.add(cor.id)
    if (cor.vendida) coresVendidas.add(cor.id)
  }
  const valores = produto ? valoresDoDetalhe(produto) : structuredClone(valoresIniciais)
  tipoAplicado.value = valores.tipo
  resetForm({ values: valores })
}

watch(
  () => [route.name, route.params.id],
  () => {
    if (route.name !== 'admin-produto-novo' && route.name !== 'admin-produto-editar') return
    carregar()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  desmontado = true
  controladorDaCarga?.abort()
  controladorDasCategorias?.abort()
  envio.descartarTudo()
})
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <div class="flex items-end justify-between gap-5">
      <div class="flex items-center gap-5">
        <button type="button" aria-label="Voltar" class="shrink-0" @click="irParaListagem">
          <IconeVoltar class="size-8" />
        </button>
        <h1 class="text-32 font-bold">{{ edicao ? 'Editar produto' : 'Cadastrar produto' }}</h1>
      </div>
      <SecaoTipo v-if="estado === 'pronta' && !edicao" />
    </div>
    <div
      v-if="estado === 'carregando'"
      class="flex h-50 items-center justify-center rounded-padrao ring-1 ring-cinza-escuro/67 ring-inset"
    >
      <BaseCarregando />
    </div>
    <div v-else-if="estado === 'erro'" class="flex flex-col items-start gap-3.75">
      <BaseMensagem class="w-full">{{ MENSAGEM_GERAL }}</BaseMensagem>
      <BaseBotao variante="secundario" tamanho="compacto" class="w-35" @click="carregar()">
        Tentar novamente
      </BaseBotao>
    </div>
    <ProdutoNaoEncontrado v-else-if="estado === 'nao-encontrado'" class="mt-5" />
    <form v-else class="flex flex-col gap-7.5" novalidate @submit.prevent="salvar">
      <SecaoInformacoes :categorias="categorias" />
      <SecaoCores
        :cores="values.cores"
        :tipo="values.tipo"
        :erros="errors"
        :tentou="tentou"
        :pode-adicionar="!temCorNova"
        :modo-de="modoDe"
        :titulo-de="tituloDe"
        :mostrar-erros-de="(cor) => comErrosVisiveis.has(cor.idLocal)"
        :enviando-na-cor="(cor) => envio.enviandoNaCor(cor.idLocal)"
        :envio-de="(cor, campo) => envio.envioDe(cor.idLocal, campo)"
        :aviso-de="(cor) => (avisosDeVenda.has(cor.idLocal) ? MENSAGEM_DE_COR_VENDIDA : undefined)"
        @adicionar="adicionarCor"
        @salvar="confirmarCor"
        @descartar="descartarCor"
        @editar="editarCor"
        @remover="pedirRemocaoDaCor"
        @escolher="escolherImagem"
      />
      <SecaoEstoque
        :linhas="linhas"
        :tem-tamanho="values.temTamanho"
        :cores="values.cores"
        :cores-do-estoque="coresDoEstoque"
        :erros="errors"
        :tentou="tentou"
        :travada="vendido"
        @adicionar="adicionarLinha"
        @mudar-tamanho="mudarTamanho"
        @trocar-cor="trocarCorDaLinha"
        @mudar-quantidade="mudarQuantidade"
        @remover="tirarLinha"
      />
      <div class="mt-7.5 flex flex-col items-center gap-5">
        <BaseMensagem v-if="erroDoEnvio" class="w-110 max-w-full">{{ erroDoEnvio }}</BaseMensagem>
        <div class="flex justify-center gap-25">
          <BaseBotao variante="secundario" tamanho="compacto" class="w-30" @click="irParaListagem">
            Cancelar
          </BaseBotao>
          <BaseBotao
            tipo="submit"
            tamanho="compacto"
            class="w-30"
            :carregando="processando || salvo"
            :desabilitado="envio.enviando.value"
          >
            {{ edicao ? 'Salvar alterações' : 'Cadastrar' }}
          </BaseBotao>
        </div>
      </div>
    </form>

    <BaseModalConfirmacao
      v-model:open="confirmacaoDeTipoAberta"
      titulo="Trocar o tipo de produto?"
      descricao="As cores perdem as imagens que o novo tipo não usa. A imagem de apresentação de cada cor continua."
      texto-confirmar="Trocar tipo"
      @confirmar="confirmarTipo"
    />
    <BaseModalConfirmacao
      v-model:open="confirmacaoDeTamanhoAberta"
      titulo="Mudar a opção de tamanho?"
      descricao="O estoque preenchido vai ser zerado em todas as cores."
      texto-confirmar="Zerar estoque"
      @confirmar="confirmarTamanho"
    />
  </div>
</template>
