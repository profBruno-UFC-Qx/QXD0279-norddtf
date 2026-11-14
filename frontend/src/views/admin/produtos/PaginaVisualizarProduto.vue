<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import { URL_API } from '@/api/http'
import { detalharProduto, mudarSituacao, removerProduto } from '@/api/produtos'
import BaseAlternador from '@/components/base/BaseAlternador.vue'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCarregando from '@/components/base/BaseCarregando.vue'
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
import BaseMensagem from '@/components/base/BaseMensagem.vue'
import BaseModalConfirmacao from '@/components/base/BaseModalConfirmacao.vue'
import IconeEditar from '@/components/icones/IconeEditar.vue'
import IconeLixeira from '@/components/icones/IconeLixeira.vue'
import IconeVoltar from '@/components/icones/IconeVoltar.vue'
import { useAvisos } from '@/stores/avisos'
import type { ProdutoDetalhado } from '@/types/produto'
import { formatarMoeda } from '@/utils/formatacao'
import CoresDoProduto from './CoresDoProduto.vue'
import GradeDeEstoque from './GradeDeEstoque.vue'

const MENSAGEM_DE_VENDIDO =
  'Este produto já foi vendido e não pode ser removido. Inative-o para tirá-lo da loja.'

const route = useRoute()
const router = useRouter()
const avisos = useAvisos()

const produto = ref<ProdutoDetalhado>()
const estado = ref<'carregando' | 'erro' | 'nao-encontrado' | 'pronta'>('carregando')
let controlador: AbortController | undefined
let desmontado = false

function idDaRota() {
  return String(route.params.id)
}

function naoEncontrado(erro: unknown): erro is ErroApi {
  return erro instanceof ErroApi && erro.codigo === 'PRODUTO_NAO_ENCONTRADO'
}

async function carregar({ silencioso = false } = {}) {
  if (desmontado) return
  const emSilencio = silencioso && estado.value === 'pronta'
  controlador?.abort()
  controlador = new AbortController()
  const { signal } = controlador
  if (!emSilencio) estado.value = 'carregando'
  try {
    produto.value = await detalharProduto(idDaRota(), signal)
    estado.value = 'pronta'
  } catch (erro) {
    if (signal.aborted) return
    if (naoEncontrado(erro)) {
      produto.value = undefined
      estado.value = 'nao-encontrado'
      return
    }
    if (!emSilencio) estado.value = 'erro'
  }
}

function voltar(irParaListagem: (destino: RouteLocationRaw) => unknown = router.push) {
  const anterior = window.history.state?.back
  if (typeof anterior === 'string' && router.resolve(anterior).name === 'admin-produtos') {
    router.back()
    return
  }
  irParaListagem({ name: 'admin-produtos' })
}

const categorias = computed(() =>
  produto.value?.categorias.map((categoria) => categoria.nome).join(' | '),
)

const capa = computed(() => {
  const cor = produto.value?.cores[0]
  if (!cor?.imagemApresentacao) return undefined
  return { url: URL_API + cor.imagemApresentacao.url, cor: cor.nome }
})

const situacaoPendente = ref<boolean>()

const ativo = computed({
  get: () => situacaoPendente.value ?? produto.value?.ativo ?? false,
  set: (valor: boolean) => trocarSituacao(valor),
})

function tratarErroDaSituacao(erro: unknown) {
  if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) return
  if (naoEncontrado(erro)) {
    avisos.erro(erro.mensagem)
    carregar({ silencioso: true })
    return
  }
  avisos.erro(MENSAGEM_GERAL)
}

async function trocarSituacao(valor: boolean) {
  const atual = produto.value
  if (!atual || situacaoPendente.value !== undefined) return
  const { id } = atual
  situacaoPendente.value = valor
  try {
    await mudarSituacao(id, valor)
  } catch (erro) {
    if (idDaRota() === id) situacaoPendente.value = undefined
    if (!desmontado) tratarErroDaSituacao(erro)
    return
  }
  avisos.sucesso(valor ? 'Produto ativado.' : 'Produto inativado.')
  if (desmontado || idDaRota() !== id) return
  if (produto.value) produto.value.ativo = valor
  situacaoPendente.value = undefined
  carregar({ silencioso: true })
}

const confirmacaoAberta = ref(false)
const avisoDeVendaAberto = ref(false)
const textoDeVenda = ref(MENSAGEM_DE_VENDIDO)
const removendo = ref(false)

function mostrarVenda(texto: string) {
  textoDeVenda.value = texto
  avisoDeVendaAberto.value = true
}

function pedirRemocao() {
  if (produto.value?.vendido) {
    mostrarVenda(MENSAGEM_DE_VENDIDO)
    return
  }
  confirmacaoAberta.value = true
}

function tratarErroDaRemocao(erro: unknown) {
  if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) return
  if (erro instanceof ErroApi && erro.codigo === 'PRODUTO_VENDIDO') {
    mostrarVenda(erro.mensagem)
    carregar({ silencioso: true })
    return
  }
  if (naoEncontrado(erro)) {
    avisos.erro(erro.mensagem)
    carregar({ silencioso: true })
    return
  }
  avisos.erro(MENSAGEM_GERAL)
}

async function remover() {
  const atual = produto.value
  if (!atual || removendo.value) return
  removendo.value = true
  try {
    await removerProduto(atual.id)
  } catch (erro) {
    if (desmontado || idDaRota() !== atual.id) return
    removendo.value = false
    confirmacaoAberta.value = false
    tratarErroDaRemocao(erro)
    return
  }
  if (!desmontado && idDaRota() !== atual.id) return
  removendo.value = false
  confirmacaoAberta.value = false
  avisos.sucesso('Produto removido.')
  if (!desmontado) voltar(router.replace)
}

watch(
  () => route.params.id,
  () => {
    if (route.name !== 'admin-produto') return
    situacaoPendente.value = undefined
    removendo.value = false
    confirmacaoAberta.value = false
    avisoDeVendaAberto.value = false
    carregar()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  desmontado = true
  controlador?.abort()
})
</script>

<template>
  <div class="flex flex-col gap-12.5">
    <div class="flex items-center gap-5">
      <button type="button" aria-label="Voltar" class="shrink-0" @click="voltar()">
        <IconeVoltar class="size-8" />
      </button>
      <h1 class="text-32 font-bold">Visualizar produto</h1>
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
      v-else-if="estado === 'nao-encontrado'"
      titulo="Produto não encontrado."
      descricao="Ele pode ter sido removido."
    >
      <template #acao>
        <RouterLink
          :to="{ name: 'admin-produtos' }"
          class="inline-flex h-9.25 items-center justify-center rounded-padrao bg-branco-dtf px-2.5 text-13 font-bold whitespace-nowrap text-preto-dtf ring-1 ring-cinza-escuro/67 ring-inset"
        >
          Voltar para produtos
        </RouterLink>
      </template>
    </BaseEstadoVazio>
    <div v-else-if="produto" class="flex flex-col gap-6.25">
      <div class="flex items-start gap-6.25">
        <img
          v-if="capa"
          :src="capa.url"
          :alt="`${produto.nome}, cor ${capa.cor}`"
          class="h-78.25 w-62.5 shrink-0 rounded-padrao object-cover"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-2.5">
          <div class="flex flex-wrap justify-between gap-5">
            <div class="flex min-w-50 flex-1 flex-col gap-2.5">
              <h2 class="text-27 font-bold wrap-break-word">{{ produto.nome }}</h2>
              <p class="text-18 font-medium wrap-break-word">{{ categorias }}</p>
              <p class="font-destaque text-24 font-extrabold">
                {{ formatarMoeda(produto.preco) }}
              </p>
            </div>
            <div class="flex w-72.75 shrink-0 flex-col gap-2.5">
              <div class="flex justify-between">
                <BaseBotao variante="secundario" tamanho="acao" class="w-31" @click="pedirRemocao">
                  <IconeLixeira class="size-6 text-erro" />
                  Remover
                </BaseBotao>
                <BaseBotao
                  tamanho="acao"
                  class="w-31"
                  @click="router.push({ name: 'admin-produto-editar', params: { id: produto.id } })"
                >
                  <IconeEditar class="size-6" />
                  Editar
                </BaseBotao>
              </div>
              <BaseAlternador v-model="ativo" />
            </div>
          </div>
          <template v-if="produto.descricao">
            <h3 class="text-16 font-bold">Descrição</h3>
            <p class="text-14 wrap-break-word whitespace-pre-line">{{ produto.descricao }}</p>
          </template>
        </div>
      </div>
      <CoresDoProduto :cores="produto.cores" :tipo="produto.tipo" />
      <GradeDeEstoque :cores="produto.cores" :tem-tamanho="produto.temTamanho" />
    </div>

    <BaseModalConfirmacao
      v-model:open="confirmacaoAberta"
      titulo="Remover produto?"
      descricao="Essa ação não pode ser desfeita."
      texto-confirmar="Remover"
      :carregando="removendo"
      @confirmar="remover"
    />
    <BaseModalConfirmacao
      v-model:open="avisoDeVendaAberto"
      titulo="Produto já vendido"
      :descricao="textoDeVenda"
      texto-confirmar="Entendi"
      variante="primario"
      informativo
      @confirmar="avisoDeVendaAberto = false"
    />
  </div>
</template>
