<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { listarCategorias } from '@/api/categorias'
import { MENSAGEM_GERAL } from '@/api/ErroApi'
import { listarProdutosDaLoja } from '@/api/loja'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseEstadoCarga from '@/components/base/BaseEstadoCarga.vue'
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
import BaseEtiqueta from '@/components/base/BaseEtiqueta.vue'
import BaseMensagem from '@/components/base/BaseMensagem.vue'
import IconeBusca from '@/components/icones/IconeBusca.vue'
import { etiquetasDosFiltros } from '@/components/produtos/etiquetasDosFiltros'
import {
  escreverFiltros,
  lerFiltros,
  LIMITE_DA_BUSCA,
  temFiltro,
} from '@/components/produtos/filtrosDaUrl'
import PainelFiltros from '@/components/produtos/PainelFiltros.vue'
import { useBuscaComEspera } from '@/composables/useBuscaComEspera'
import type { Categoria } from '@/types/categoria'
import type { FiltrosProdutos, ListagemDaLoja } from '@/types/produto'
import CardDaLoja from './CardDaLoja.vue'

const route = useRoute()
const router = useRouter()

const filtros = computed(() => ({ ...lerFiltros(route.query), pagina: 1 }))

const listagem = ref<ListagemDaLoja>()
const ultimaVeioCheia = ref(false)
const categorias = ref<Categoria[]>()
const estado = ref<'carregando' | 'erro' | 'pronta'>('carregando')
const carregandoMais = ref(false)
const erroAoCarregarMais = ref(false)
let controlador: AbortController | undefined
let desmontado = false

function novoSinal() {
  controlador?.abort()
  controlador = new AbortController()
  return controlador.signal
}

function categoriasConhecidas(pedido: FiltrosProdutos, lista: Categoria[]) {
  return pedido.categorias.filter((id) => lista.some((categoria) => categoria.id === id))
}

async function carregar() {
  if (desmontado) return
  const signal = novoSinal()
  const pedido = filtros.value
  estado.value = 'carregando'
  carregandoMais.value = false
  erroAoCarregarMais.value = false
  try {
    const [resposta, lista] = await Promise.all([
      listarProdutosDaLoja(pedido, signal),
      categorias.value ?? listarCategorias(signal),
    ])
    categorias.value = lista
    const conhecidas = categoriasConhecidas(pedido, lista)
    if (conhecidas.length < pedido.categorias.length) {
      router.replace({ query: escreverFiltros({ ...pedido, categorias: conhecidas }) })
      return
    }
    listagem.value = resposta
    ultimaVeioCheia.value = resposta.itens.length === resposta.porPagina
    estado.value = 'pronta'
  } catch {
    if (!signal.aborted) estado.value = 'erro'
  }
}

async function carregarMais() {
  if (!listagem.value || carregandoMais.value) return
  const signal = novoSinal()
  carregandoMais.value = true
  erroAoCarregarMais.value = false
  try {
    const resposta = await listarProdutosDaLoja(
      { ...filtros.value, pagina: listagem.value.pagina + 1 },
      signal,
    )
    const vistos = new Set(listagem.value.itens.map((item) => item.id))
    const novos = resposta.itens.filter((item) => !vistos.has(item.id))
    listagem.value = { ...resposta, itens: [...listagem.value.itens, ...novos] }
    ultimaVeioCheia.value = resposta.itens.length === resposta.porPagina
  } catch {
    if (!signal.aborted) erroAoCarregarMais.value = true
  } finally {
    if (!signal.aborted) carregandoMais.value = false
  }
}

watch(
  () => route.query,
  () => {
    if (route.name === 'loja-produtos') carregar()
  },
  { immediate: true },
)

function irPara(mudanca: Partial<FiltrosProdutos>) {
  router.push({ query: escreverFiltros({ ...filtros.value, ...mudanca }) })
}

const { buscar } = useBuscaComEspera(
  () => filtros.value.busca,
  (busca) => router.replace({ query: escreverFiltros({ ...filtros.value, busca }) }),
)

onBeforeUnmount(() => {
  desmontado = true
  controlador?.abort()
})

const etiquetas = computed(() =>
  etiquetasDosFiltros(filtros.value, categorias.value ?? [], listagem.value?.faixaDePreco),
)

const semItens = computed(() => listagem.value?.itens.length === 0)

const lojaVazia = computed(() => semItens.value && !temFiltro(filtros.value))

const temMais = computed(() => {
  const atual = listagem.value
  if (!atual || !ultimaVeioCheia.value) return false
  return atual.pagina < Math.ceil(atual.total / atual.porPagina)
})
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <h1 class="sr-only">Produtos</h1>
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between gap-1.25">
        <form role="search" class="min-w-0 flex-[0_1_489px]" @submit.prevent="buscar">
          <BaseCampoTexto
            nome="busca"
            rotulo="Pesquisar produtos"
            rotulo-oculto
            :icone="IconeBusca"
            :limite="LIMITE_DA_BUSCA"
            placeholder="Pesquisar produto"
          />
        </form>
        <PainelFiltros
          :aplicados="filtros"
          :categorias="categorias ?? []"
          :faixa-de-preco="listagem?.faixaDePreco ?? null"
          @aplicar="irPara"
        />
      </div>
      <ul v-if="etiquetas.length" aria-label="Filtros aplicados" class="flex flex-wrap gap-5">
        <li v-for="etiqueta in etiquetas" :key="etiqueta.chave">
          <BaseEtiqueta :texto="etiqueta.texto" @remover="irPara(etiqueta.sem)" />
        </li>
      </ul>
    </div>
    <BaseEstadoCarga
      v-if="estado === 'carregando' || estado === 'erro'"
      :estado="estado"
      @tentar-novamente="carregar()"
    />
    <BaseEstadoVazio
      v-else-if="lojaVazia"
      titulo="Nenhum produto à venda no momento."
      descricao="Os produtos aparecem aqui assim que entrarem na loja."
    />
    <p v-else-if="semItens" role="status" class="text-center text-18">
      Nenhum produto encontrado. Tente buscar outro nome ou categoria.
    </p>
    <div v-else-if="listagem" class="flex flex-col gap-7.5">
      <ul
        aria-label="Produtos"
        class="grid grid-cols-2 gap-x-2.5 gap-y-5 md:grid-cols-3 md:gap-5 lg:grid-cols-4"
      >
        <li v-for="produto in listagem.itens" :key="produto.id">
          <CardDaLoja :produto="produto" />
        </li>
      </ul>
      <div v-if="temMais" class="flex flex-col items-center gap-3.75">
        <BaseMensagem v-if="erroAoCarregarMais" class="w-full">{{ MENSAGEM_GERAL }}</BaseMensagem>
        <BaseBotao
          variante="secundario"
          tamanho="compacto"
          class="w-35"
          :carregando="carregandoMais"
          @click="carregarMais"
        >
          Carregar mais
        </BaseBotao>
      </div>
    </div>
  </div>
</template>
