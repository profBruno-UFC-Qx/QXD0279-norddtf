<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'

import { listarCategorias } from '@/api/categorias'
import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import { listarProdutos, mudarSituacao } from '@/api/produtos'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseCarregando from '@/components/base/BaseCarregando.vue'
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
import BaseEtiqueta from '@/components/base/BaseEtiqueta.vue'
import BaseMensagem from '@/components/base/BaseMensagem.vue'
import BasePaginacao from '@/components/base/BasePaginacao.vue'
import IconeBusca from '@/components/icones/IconeBusca.vue'
import IconeCabide from '@/components/icones/IconeCabide.vue'
import { useAvisos } from '@/stores/avisos'
import type { Categoria } from '@/types/categoria'
import type { FiltrosProdutos, ItemProduto, ListagemProdutos } from '@/types/produto'
import { formatarMoeda } from '@/utils/formatacao'
import CardProduto from './CardProduto.vue'
import { escreverFiltros, lerFiltros, LIMITE_DA_BUSCA, temFiltro } from './filtrosDaUrl'
import PainelFiltros from './PainelFiltros.vue'

const ESPERA_DA_BUSCA = 400

type Etiqueta = { chave: string; texto: string; sem: Partial<FiltrosProdutos> }

const route = useRoute()
const router = useRouter()
const avisos = useAvisos()

const filtros = computed(() => lerFiltros(route.query))

const listagem = ref<ListagemProdutos>()
const categorias = ref<Categoria[]>()
const estado = ref<'carregando' | 'erro' | 'pronta'>('carregando')
const pendentes = new Map<string, boolean>()
let controlador: AbortController | undefined
let desmontado = false

function corrigirPedido(pedido: FiltrosProdutos, lista: Categoria[], resposta: ListagemProdutos) {
  const conhecidas = pedido.categorias.filter((id) =>
    lista.some((categoria) => categoria.id === id),
  )
  const ultima = Math.max(1, Math.ceil(resposta.total / resposta.porPagina))
  if (conhecidas.length < pedido.categorias.length) return { ...pedido, categorias: conhecidas }
  if (pedido.pagina > ultima) return { ...pedido, pagina: ultima }
  return undefined
}

async function carregar({ silencioso = false } = {}) {
  if (desmontado) return
  const emSilencio = silencioso && estado.value === 'pronta'
  controlador?.abort()
  controlador = new AbortController()
  const { signal } = controlador
  const pedido = filtros.value
  if (!emSilencio) estado.value = 'carregando'
  try {
    const [resposta, lista] = await Promise.all([
      listarProdutos(pedido, signal),
      categorias.value ?? listarCategorias(signal),
    ])
    categorias.value = lista
    const corrigido = corrigirPedido(pedido, lista, resposta)
    if (corrigido) {
      router.replace({ query: escreverFiltros(corrigido) })
      return
    }
    resposta.itens.forEach((item) => {
      item.ativo = pendentes.get(item.id) ?? item.ativo
    })
    listagem.value = resposta
    estado.value = 'pronta'
  } catch {
    if (!signal.aborted && !emSilencio) estado.value = 'erro'
  }
}

watch(
  () => route.query,
  () => {
    if (route.name === 'admin-produtos') carregar()
  },
  { immediate: true },
)

function irPara(mudanca: Partial<FiltrosProdutos>) {
  router.push({ query: escreverFiltros({ ...filtros.value, pagina: 1, ...mudanca }) })
}

const { values, setFieldValue } = useForm({ initialValues: { busca: filtros.value.busca } })
let espera: ReturnType<typeof setTimeout> | undefined

function buscar() {
  clearTimeout(espera)
  const busca = (values.busca ?? '').trim()
  if (busca === filtros.value.busca) return
  router.replace({ query: escreverFiltros({ ...filtros.value, busca, pagina: 1 }) })
}

watch(
  () => values.busca,
  () => {
    clearTimeout(espera)
    espera = setTimeout(buscar, ESPERA_DA_BUSCA)
  },
)

watch(
  () => filtros.value.busca,
  (busca) => {
    if ((values.busca ?? '').trim() !== busca) setFieldValue('busca', busca)
  },
)

onBeforeUnmount(() => {
  desmontado = true
  controlador?.abort()
  clearTimeout(espera)
})

function textoDaFaixa({ precoMin, precoMax }: FiltrosProdutos) {
  const faixa = listagem.value?.faixaDePreco
  return [precoMin ?? faixa?.min, precoMax ?? faixa?.max]
    .filter((preco) => preco !== undefined)
    .map((preco) => formatarMoeda(preco))
    .join(' a ')
}

const etiquetas = computed(() => {
  const atuais = filtros.value
  const nomes = new Map(categorias.value?.map((categoria) => [categoria.id, categoria.nome]))
  const lista: Etiqueta[] = atuais.categorias.flatMap((id) => {
    const nome = nomes.get(id)
    if (!nome) return []
    return [
      {
        chave: id,
        texto: nome,
        sem: { categorias: atuais.categorias.filter((outro) => outro !== id) },
      },
    ]
  })
  if (atuais.precoMin || atuais.precoMax) {
    lista.push({
      chave: 'preco',
      texto: textoDaFaixa(atuais),
      sem: { precoMin: undefined, precoMax: undefined },
    })
  }
  atuais.tamanhos.forEach((tamanho) => {
    lista.push({
      chave: tamanho,
      texto: `Tamanho ${tamanho}`,
      sem: { tamanhos: atuais.tamanhos.filter((outro) => outro !== tamanho) },
    })
  })
  return lista
})

const semProdutos = computed(() => listagem.value?.total === 0 && !temFiltro(filtros.value))

function tratarErroDaSituacao(erro: unknown) {
  if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) return
  if (erro instanceof ErroApi && erro.codigo === 'PRODUTO_NAO_ENCONTRADO') {
    avisos.erro(erro.mensagem)
    carregar({ silencioso: true })
    return
  }
  avisos.erro(MENSAGEM_GERAL)
}

async function trocarSituacao(produto: ItemProduto, ativo: boolean) {
  const { id, ativo: anterior } = produto
  if (pendentes.has(id)) return
  pendentes.set(id, ativo)
  produto.ativo = ativo
  try {
    await mudarSituacao(id, ativo)
  } catch (erro) {
    pendentes.delete(id)
    const atual = listagem.value?.itens.find((item) => item.id === id)
    if (atual) atual.ativo = anterior
    tratarErroDaSituacao(erro)
    return
  }
  pendentes.delete(id)
  avisos.sucesso(ativo ? 'Produto ativado.' : 'Produto inativado.')
  carregar({ silencioso: true })
}

function editar(produto: ItemProduto) {
  router.push({ name: 'admin-produto-editar', params: { id: produto.id } })
}
</script>

<template>
  <div class="flex flex-col gap-12.5">
    <h1 class="text-32 font-bold">Produtos</h1>
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between gap-5">
        <form role="search" class="min-w-0 flex-[0_1_489px]" @submit.prevent="buscar">
          <BaseCampoTexto
            nome="busca"
            rotulo="Pesquisar produtos"
            rotulo-oculto
            :icone="IconeBusca"
            :limite="LIMITE_DA_BUSCA"
            placeholder="Pesquisar por nome, categoria ou descrição"
          />
        </form>
        <div class="flex shrink-0 items-center gap-7.5">
          <PainelFiltros
            :aplicados="filtros"
            :categorias="categorias ?? []"
            :faixa-de-preco="listagem?.faixaDePreco ?? null"
            @aplicar="irPara"
          />
          <BaseBotao tamanho="acao" @click="router.push({ name: 'admin-produto-novo' })">
            <IconeCabide class="size-6" />
            Cadastrar produto
          </BaseBotao>
        </div>
      </div>
      <ul v-if="etiquetas.length" aria-label="Filtros aplicados" class="flex flex-wrap gap-5">
        <li v-for="etiqueta in etiquetas" :key="etiqueta.chave">
          <BaseEtiqueta :texto="etiqueta.texto" @remover="irPara(etiqueta.sem)" />
        </li>
      </ul>
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
    <BaseEstadoVazio
      v-else-if="semProdutos"
      titulo="Nenhum produto cadastrado."
      descricao="Os produtos cadastrados aparecem aqui, ativos e inativos."
    >
      <template #acao>
        <BaseBotao tamanho="compacto" @click="router.push({ name: 'admin-produto-novo' })">
          Cadastrar produto
        </BaseBotao>
      </template>
    </BaseEstadoVazio>
    <p v-else-if="listagem?.total === 0" role="status" class="text-center text-18">
      Nenhum produto encontrado. Tente buscar outro nome ou categoria.
    </p>
    <div v-else-if="listagem" class="flex flex-col gap-7.5">
      <ul aria-label="Produtos" class="grid grid-cols-4 items-start justify-items-center gap-2.5">
        <li v-for="produto in listagem.itens" :key="produto.id">
          <CardProduto
            :produto="produto"
            @mudar-situacao="trocarSituacao(produto, $event)"
            @editar="editar(produto)"
          />
        </li>
      </ul>
      <BasePaginacao
        :pagina="listagem.pagina"
        :total="listagem.total"
        :por-pagina="listagem.porPagina"
        @mudar="irPara({ pagina: $event })"
      />
    </div>
  </div>
</template>
