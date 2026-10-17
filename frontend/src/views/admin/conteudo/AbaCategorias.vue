<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'

import {
  criarCategoria,
  listarCategoriasComUso,
  removerCategoria,
  renomearCategoria,
} from '@/api/categorias'
import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseCarregando from '@/components/base/BaseCarregando.vue'
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
import BaseMensagem from '@/components/base/BaseMensagem.vue'
import BaseModalConfirmacao from '@/components/base/BaseModalConfirmacao.vue'
import BaseModalFormulario from '@/components/base/BaseModalFormulario.vue'
import IconeMais from '@/components/icones/IconeMais.vue'
import { useAvisos } from '@/stores/avisos'
import type { CategoriaComUso } from '@/types/categoria'
import { mensagemDeUso } from '@/utils/mensagemDeUso'
import { aplicarErrosDaApi, schemaZod } from '@/utils/validacao'
import TabelaCategorias from './TabelaCategorias.vue'

const esquemaCategoria = z.object({
  nome: z
    .string({ error: 'Informe o nome da categoria.' })
    .trim()
    .min(1, { error: 'Informe o nome da categoria.' })
    .max(40, { error: 'O nome pode ter até 40 caracteres.' }),
})

const avisos = useAvisos()

const categorias = ref<CategoriaComUso[]>([])
const estado = ref<'carregando' | 'erro' | 'pronta'>('carregando')
let controlador: AbortController | undefined

async function carregar() {
  controlador?.abort()
  controlador = new AbortController()
  const { signal } = controlador
  if (estado.value !== 'pronta') estado.value = 'carregando'
  try {
    categorias.value = await listarCategoriasComUso(signal)
    estado.value = 'pronta'
  } catch {
    if (!signal.aborted) estado.value = 'erro'
  }
}

onMounted(carregar)
onBeforeUnmount(() => controlador?.abort())

const { handleSubmit, isSubmitting, resetForm, setErrors, setFieldError } = useForm({
  validationSchema: schemaZod(esquemaCategoria),
  initialValues: { nome: '' },
})

const formularioAberto = ref(false)
const emEdicao = ref<CategoriaComUso>()
const erroDoEnvio = ref<string>()

function abrirFormulario(categoria?: CategoriaComUso) {
  emEdicao.value = categoria
  erroDoEnvio.value = undefined
  resetForm({ values: { nome: categoria?.nome ?? '' } })
  formularioAberto.value = true
}

function tratarErroDoEnvio(erro: unknown) {
  if (aplicarErrosDaApi(erro, setErrors)) return
  if (erro instanceof ErroApi && erro.codigo === 'CATEGORIA_JA_CADASTRADA') {
    setFieldError('nome', erro.mensagem)
    return
  }
  if (erro instanceof ErroApi && erro.codigo === 'CATEGORIA_NAO_ENCONTRADA') {
    formularioAberto.value = false
    avisos.erro(erro.mensagem)
    carregar()
    return
  }
  erroDoEnvio.value = MENSAGEM_GERAL
}

const enviar = handleSubmit(
  async ({ nome }) => {
    erroDoEnvio.value = undefined
    const categoria = emEdicao.value
    try {
      if (categoria) await renomearCategoria(categoria.id, nome)
      else await criarCategoria(nome)
    } catch (erro) {
      tratarErroDoEnvio(erro)
      return
    }
    formularioAberto.value = false
    avisos.sucesso(categoria ? 'Categoria renomeada.' : 'Categoria criada.')
    carregar()
  },
  () => {
    erroDoEnvio.value = undefined
  },
)

const confirmacaoAberta = ref(false)
const aRemover = ref<CategoriaComUso>()
const removendo = ref(false)
const descricaoDaRemocao = computed(() => `A categoria "${aRemover.value?.nome}" será removida.`)
const avisoDeUsoAberto = ref(false)
const textoDeUso = ref('')

function mostrarUso(texto: string) {
  textoDeUso.value = texto
  avisoDeUsoAberto.value = true
}

function pedirRemocao(categoria: CategoriaComUso) {
  if (categoria.produtos + categoria.estampas > 0) {
    mostrarUso(mensagemDeUso(categoria.produtos, categoria.estampas))
    return
  }
  aRemover.value = categoria
  confirmacaoAberta.value = true
}

function tratarErroDaRemocao(erro: unknown) {
  if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) return
  if (erro instanceof ErroApi && erro.codigo === 'CATEGORIA_EM_USO') {
    mostrarUso(erro.mensagem)
    carregar()
    return
  }
  if (erro instanceof ErroApi && erro.codigo === 'CATEGORIA_NAO_ENCONTRADA') {
    avisos.erro(erro.mensagem)
    carregar()
    return
  }
  avisos.erro(MENSAGEM_GERAL)
}

async function remover() {
  if (!aRemover.value) return
  removendo.value = true
  try {
    await removerCategoria(aRemover.value.id)
    avisos.sucesso('Categoria removida.')
    carregar()
  } catch (erro) {
    tratarErroDaRemocao(erro)
  } finally {
    removendo.value = false
    confirmacaoAberta.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6.25">
    <div class="flex justify-end">
      <BaseBotao tamanho="acao" @click="abrirFormulario()">
        <IconeMais class="size-6" />
        Nova categoria
      </BaseBotao>
    </div>
    <div
      v-if="estado === 'carregando'"
      class="flex h-50 items-center justify-center rounded-padrao ring-1 ring-cinza-escuro/67 ring-inset"
    >
      <BaseCarregando />
    </div>
    <div v-else-if="estado === 'erro'" class="flex flex-col items-start gap-3.75">
      <BaseMensagem class="w-full">{{ MENSAGEM_GERAL }}</BaseMensagem>
      <BaseBotao variante="secundario" tamanho="compacto" class="w-35" @click="carregar">
        Tentar novamente
      </BaseBotao>
    </div>
    <BaseEstadoVazio
      v-else-if="categorias.length === 0"
      titulo="Nenhuma categoria cadastrada."
      descricao="As categorias organizam produtos e estampas na loja."
    >
      <template #acao>
        <BaseBotao tamanho="compacto" @click="abrirFormulario()">Nova categoria</BaseBotao>
      </template>
    </BaseEstadoVazio>
    <TabelaCategorias
      v-else
      :categorias="categorias"
      @renomear="abrirFormulario"
      @remover="pedirRemocao"
    />

    <BaseModalFormulario
      v-model:open="formularioAberto"
      :titulo="emEdicao ? 'Renomear categoria' : 'Nova categoria'"
      :texto-confirmar="emEdicao ? 'Salvar' : 'Criar'"
      :carregando="isSubmitting"
      :erro="erroDoEnvio"
      @enviar="enviar"
    >
      <BaseCampoTexto nome="nome" rotulo="Nome" :limite="40" />
    </BaseModalFormulario>
    <BaseModalConfirmacao
      v-model:open="confirmacaoAberta"
      titulo="Remover categoria"
      :descricao="descricaoDaRemocao"
      texto-confirmar="Remover"
      :carregando="removendo"
      @confirmar="remover"
    />
    <BaseModalConfirmacao
      v-model:open="avisoDeUsoAberto"
      titulo="Categoria em uso"
      :descricao="textoDeUso"
      texto-confirmar="Entendi"
      variante="primario"
      informativo
      @confirmar="avisoDeUsoAberto = false"
    />
  </div>
</template>
