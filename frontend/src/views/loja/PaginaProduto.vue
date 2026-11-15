<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import { ErroApi } from '@/api/ErroApi'
import { URL_API } from '@/api/http'
import { detalharProdutoDaLoja } from '@/api/loja'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseEstadoCarga from '@/components/base/BaseEstadoCarga.vue'
import BaseTrilha from '@/components/base/BaseTrilha.vue'
import IconePincel from '@/components/icones/IconePincel.vue'
import IconeSacola from '@/components/icones/IconeSacola.vue'
import IconeVoltar from '@/components/icones/IconeVoltar.vue'
import { useAcaoRestrita } from '@/composables/useAcaoRestrita'
import type {
  EntradaDeEstoque,
  EscolhaDoProduto,
  ProdutoDaLoja,
  TipoProduto,
} from '@/types/produto'
import { adicionarASacola, personalizar } from '@/utils/acoesDaLoja'
import { lerEscolha, mesclarEscolha } from '@/utils/escolhaDaUrl'
import { formatarMoeda } from '@/utils/formatacao'
import EscolhaDeCor from './EscolhaDeCor.vue'
import ProdutoNaoEncontradoDaLoja from './ProdutoNaoEncontradoDaLoja.vue'
import QuantidadesPorTamanho from './QuantidadesPorTamanho.vue'

const acaoPorTipo = {
  PERSONALIZAVEL: { rotulo: 'Personalizar', icone: IconePincel, executar: personalizar },
  VENDA_DIRETA: { rotulo: 'Adicionar à sacola', icone: IconeSacola, executar: adicionarASacola },
} satisfies Record<TipoProduto, unknown>

const route = useRoute()
const router = useRouter()
const { exigirLogin } = useAcaoRestrita()
const idDescricao = useId()

const produto = ref<ProdutoDaLoja>()
const estado = ref<'carregando' | 'erro' | 'nao-encontrado' | 'pronta'>('carregando')
const escolha = ref<EscolhaDoProduto>({ corId: null, quantidades: [] })
const descricaoAberta = ref(false)
let controlador: AbortController | undefined
let escolhaNaUrl: Promise<unknown> = Promise.resolve()

function naoEncontrado(erro: unknown) {
  return erro instanceof ErroApi && erro.codigo === 'PRODUTO_NAO_ENCONTRADO'
}

function gravar(nova: EscolhaDoProduto) {
  escolha.value = nova
  const destino = router.resolve({ query: mesclarEscolha(route.query, nova), hash: route.hash })
  if (destino.fullPath !== route.fullPath) escolhaNaUrl = router.replace(destino)
}

async function carregar() {
  controlador?.abort()
  controlador = new AbortController()
  const { signal } = controlador
  estado.value = 'carregando'
  descricaoAberta.value = false
  try {
    const resposta = await detalharProdutoDaLoja(String(route.params.id), signal)
    if (signal.aborted) return
    produto.value = resposta
    gravar(lerEscolha(route.query, resposta))
    estado.value = 'pronta'
  } catch (erro) {
    if (signal.aborted) return
    produto.value = undefined
    estado.value = naoEncontrado(erro) ? 'nao-encontrado' : 'erro'
  }
}

watch(
  () => route.params.id,
  () => {
    if (route.name !== 'loja-produto') return
    window.scrollTo({ top: 0, behavior: 'instant' })
    produto.value = undefined
    carregar()
  },
  { immediate: true },
)

onBeforeRouteLeave(() => controlador?.abort())
onBeforeUnmount(() => controlador?.abort())

const trilha = computed(() => [
  { rotulo: 'Produtos', para: { name: 'loja-produtos' } },
  { rotulo: produto.value?.nome ?? 'Produto' },
])

const categorias = computed(() =>
  produto.value?.categorias.map((categoria) => categoria.nome).join(' | '),
)

const corEscolhida = computed(() =>
  produto.value?.cores.find((cor) => cor.id === escolha.value.corId),
)

const corDaImagem = computed(() => corEscolhida.value ?? produto.value?.cores[0])

const acao = computed(() => produto.value && acaoPorTipo[produto.value.tipo])

const acaoHabilitada = computed(() => {
  if (!escolha.value.corId) return false
  if (produto.value?.tipo === 'PERSONALIZAVEL') return true
  return escolha.value.quantidades.some((entrada) => entrada.quantidade > 0)
})

function escolherCor(corId: string) {
  const cor = produto.value?.cores.find((item) => item.id === corId)
  if (!cor || cor.id === escolha.value.corId) return
  gravar({ corId, quantidades: cor.estoque.map(({ tamanho }) => ({ tamanho, quantidade: 0 })) })
}

function mudarQuantidades(quantidades: EntradaDeEstoque[]) {
  gravar({ ...escolha.value, quantidades })
}

async function agir() {
  if (!produto.value || !acao.value || !acaoHabilitada.value) return
  await escolhaNaUrl
  if (!exigirLogin()) return
  acao.value.executar(produto.value, escolha.value)
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <BaseTrilha :itens="trilha" />
    <BaseEstadoCarga
      v-if="estado === 'carregando' || estado === 'erro'"
      :estado="estado"
      @tentar-novamente="carregar()"
    />
    <ProdutoNaoEncontradoDaLoja v-else-if="estado === 'nao-encontrado'" />
    <div
      v-else-if="produto && acao"
      class="grid items-start gap-y-7.5 md:grid-cols-[320px_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-7.5 lg:grid-cols-[500px_minmax(0,1fr)] lg:gap-x-12.5"
    >
      <div class="flex flex-col gap-1.25 md:col-start-2">
        <h1 class="text-24 font-bold lg:text-32">{{ produto.nome }}</h1>
        <p v-if="categorias" class="text-16 font-medium">{{ categorias }}</p>
      </div>
      <img
        v-if="corDaImagem"
        :src="URL_API + corDaImagem.imagem"
        :alt="`${produto.nome}, cor ${corDaImagem.nome}`"
        class="aspect-400/532 w-full object-cover md:col-start-1 md:row-span-2 md:row-start-1 md:aspect-auto md:h-106.25 md:w-80 lg:h-166.25 lg:w-125"
      />
      <div class="flex flex-col gap-7.5 md:col-start-2">
        <div class="flex flex-col gap-5">
          <EscolhaDeCor :cores="produto.cores" :cor-id="escolha.corId" @escolher="escolherCor" />
          <p class="text-32 font-semibold">{{ formatarMoeda(produto.preco) }}</p>
        </div>
        <QuantidadesPorTamanho
          v-if="corEscolhida"
          :estoque="corEscolhida.estoque"
          :model-value="escolha.quantidades"
          @update:model-value="mudarQuantidades"
        />
        <div v-if="produto.descricao" class="flex flex-col gap-2.5">
          <button
            type="button"
            class="flex h-8 w-full items-center justify-between text-24 font-medium"
            :aria-expanded="descricaoAberta"
            :aria-controls="idDescricao"
            @click="descricaoAberta = !descricaoAberta"
          >
            Descrição do produto
            <IconeVoltar
              class="size-6 shrink-0"
              :class="descricaoAberta ? 'rotate-90' : '-rotate-90'"
            />
          </button>
          <p v-show="descricaoAberta" :id="idDescricao" class="text-16 whitespace-pre-line">
            {{ produto.descricao }}
          </p>
        </div>
        <BaseBotao class="w-full md:max-w-100" :desabilitado="!acaoHabilitada" @click="agir">
          <component :is="acao.icone" class="size-6 shrink-0" />
          {{ acao.rotulo }}
        </BaseBotao>
      </div>
    </div>
  </div>
</template>
