<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAvisos } from '@/stores/avisos'
import { listarSacola, atualizarItemSacola, removerItemSacola } from '@/api/sacola'
import { formatarMoeda } from '@/utils/formatacao'

import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseModalConfirmacao from '@/components/base/BaseModalConfirmacao.vue'

const avisos = useAvisos()
const router = useRouter()

const itens = ref<ItemSacola[]>([])
const total = ref(0)
const carregando = ref(true)
const salvando = ref(false)
const itemParaRemover = ref<string | null>(null)
const itemRemoverNome = ref('')
const modalRemoverAberto = ref(false)

interface ItemSacola {
  id: string
  tipo: 'PRODUTO' | 'MATERIAL'
  produtoVarianteId: string | null
  produtoNome: string | null
  produtoTipo: string | null
  corNome: string | null
  corHex: string | null
  tamanho: string | null
  quantidade: number | null
  materialNome: string | null
  comprimentoCm: number | null
  precoUnitario: number
  selecionado: boolean
  estampas: {
    id: string
    arteClienteUrl: string | null
    posicao: string | null
    quantidade: number
    larguraCm: number
    alturaCm: number
  }[]
  valorTotal: number
}

async function carregarSacola() {
  carregando.value = true
  try {
    const { itens: itensLista, total: totalValor } = await listarSacola()
    itens.value = itensLista
    total.value = totalValor
  } catch (erro: unknown) {
    if (erro && typeof erro === 'object' && 'status' in erro && (erro as { status: number }).status === 401) {
      router.push('/login')
    } else {
      avisos.erro('Não foi possível carregar a sacola.')
    }
  } finally {
    carregando.value = false
  }
}

const itensSelecionados = computed(() => itens.value.filter((i: ItemSacola) => i.selecionado))
const totalSelecionados = computed(() => itensSelecionados.value.reduce((s: number, i: ItemSacola) => s + i.valorTotal, 0))
const quantidadeSelecionada = computed(() => itensSelecionados.value.reduce((s: number, i: ItemSacola) => s + (i.quantidade ?? 0), 0))
const algumSelecionado = computed(() => itensSelecionados.value.length > 0)
const algumIndisponivel = computed(() => itens.value.some((i: ItemSacola) => !i.selecionado))

function alternarSelecao(id: string) {
  const item = itens.value.find((i: ItemSacola) => i.id === id)
  if (item) {
    item.selecionado = !item.selecionado
    atualizarItemSacola(id, { selecionado: item.selecionado }).catch(() => {
      item.selecionado = !item.selecionado
    })
  }
}

function alternarSelecionarTodos() {
  const todosSelecionados = itens.value.every((i: ItemSacola) => i.selecionado)
  const novoEstado = !todosSelecionados
  itens.value.forEach((i: ItemSacola) => {
    i.selecionado = novoEstado
    atualizarItemSacola(i.id, { selecionado: novoEstado }).catch(() => {
      i.selecionado = !novoEstado
    })
  })
}

async function alterarQuantidade(id: string, delta: number) {
  const item = itens.value.find((i: ItemSacola) => i.id === id)
  if (!item || item.quantidade == null) return

  const novaQuantidade = item.quantidade + delta
  if (novaQuantidade < 1) return

  item.quantidade = novaQuantidade
  try {
    await atualizarItemSacola(id, { quantidade: novaQuantidade })
  } catch {
    item.quantidade = item.quantidade + delta * -1
  }
}

async function removerItem(id: string) {
  const item = itens.value.find((i: ItemSacola) => i.id === id)
  if (!item) return

  itemParaRemover.value = id
  itemRemoverNome.value = item.produtoNome ?? item.materialNome ?? 'Item'
  modalRemoverAberto.value = true
}

async function confirmarRemover() {
  if (!itemParaRemover.value) return
  salvando.value = true
  try {
    await removerItemSacola(itemParaRemover.value)
    itens.value = itens.value.filter((i: ItemSacola) => i.id !== itemParaRemover.value)
    total.value = itens.value.reduce((s: number, i: ItemSacola) => s + i.valorTotal, 0)
    avisos.sucesso('Item removido da sacola.')
  } catch {
    avisos.erro('Não foi possível remover o item.')
  } finally {
    salvando.value = false
    itemParaRemover.value = null
    itemRemoverNome.value = ''
    modalRemoverAberto.value = false
  }
}

function irParaCheckout() {
  if (!algumSelecionado.value) return
  router.push({ name: 'loja-checkout' })
}

onMounted(() => {
  carregarSacola()
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-5 py-10 md:px-7.5 lg:px-12.5">
    <h1 class="font-destaque text-32 font-black uppercase leading-[0.85] tracking-[-0.04em] mb-2">
      Sacola
    </h1>

    <div v-if="carregando" class="flex justify-center py-10">
      <p class="text-14 text-cinza-dtf">Carregando sua sacola...</p>
    </div>

    <div v-if="!carregando && itens.length === 0" class="text-center py-20">
      <h2 class="font-destaque text-24 font-black uppercase leading-[0.9] mb-3">
        Sua sacola está vazia.
      </h2>
      <p class="text-14 leading-relaxed text-cinza-dtf mb-6">
        Que tal criar algo incrível agora mesmo?
      </p>
      <BaseBotao variant="primario" @click="router.push({ name: 'loja-produtos' })">
        Personalizar agora
      </BaseBotao>
    </div>

    <div v-if="!carregando && itens.length > 0">
      <!-- Resumo -->
      <div class="mb-8 p-5 border border-preto-dtf/10 rounded-padrao bg-cinza-claro">
        <div class="flex items-center justify-between mb-3">
          <span class="text-13 font-bold uppercase tracking-[0.12em] text-cinza-dtf">
            Itens selecionados
          </span>
          <span class="text-13 font-bold text-preto-dtf">
            {{ quantidadeSelecionada }} itens
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-13 font-bold uppercase tracking-[0.12em] text-cinza-dtf">
            Valor total
          </span>
          <span class="text-18 font-black text-preto-dtf">
            {{ formatarMoeda(totalSelecionados.toString()) }}
          </span>
        </div>
      </div>

      <!-- Controle de seleção -->
      <div class="flex items-center justify-between mb-4">
        <label class="flex items-center gap-2 cursor-pointer text-13 font-bold uppercase tracking-[0.1em] text-cinza-dtf">
          <input
            type="checkbox"
            :checked="itens.length > 0 && itens.every((i) => i.selecionado)"
            @change="alternarSelecionarTodos"
          />
          <span>{{ algumSelecionado ? 'Desmarcar todos' : 'Selecionar todos' }}</span>
        </label>
        <span v-if="algumIndisponivel" class="text-13 text-cinza-escuro">
          Itens indisponíveis não podem ser selecionados.
        </span>
      </div>

      <!-- Lista de itens -->
      <div class="space-y-4">
        <div
          v-for="item in itens"
          :key="item.id"
          class="flex flex-col gap-3 border border-preto-dtf/10 rounded-padrao p-4"
        >
          <div class="flex items-start gap-4">
            <input
              type="checkbox"
              :checked="item.selecionado"
              :disabled="!item.selecionado && item.tipo === 'PRODUTO'"
              @change="alternarSelecao(item.id)"
              class="mt-1 shrink-0 text-amarelo-dtf"
            />

            <div class="flex-1">
              <h3 class="text-14 font-bold text-preto-dtf leading-snug">
                {{ item.produtoNome ?? item.materialNome ?? 'Item' }}
              </h3>

              <div class="flex items-center gap-2 mt-1">
                <span v-if="item.corNome" class="text-12 font-bold uppercase tracking-[0.1em] text-cinza-dtf">
                  {{ item.corNome }}
                </span>
                <span v-if="item.tamanho" class="text-12 font-bold uppercase tracking-[0.1em] text-cinza-dtf">
                  {{ item.tamanho }}
                </span>
                <span v-if="item.tipo === 'MATERIAL' && item.comprimentoCm" class="text-12 font-bold uppercase tracking-[0.1em] text-cinza-dtf">
                  {{ item.comprimentoCm }} cm
                </span>
              </div>

              <p v-if="item.estampas.length > 0" class="mt-1 text-12 text-cinza-escuro">
                {{ item.estampas.length }} estampa(s)
              </p>
            </div>

            <div class="text-right">
              <span class="text-14 font-bold text-preto-dtf block">
                {{ formatarMoeda(item.valorTotal.toString()) }}
              </span>
              <button
                type="button"
                @click="removerItem(item.id)"
                class="mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-erro hover:opacity-70"
              >
                Remover
              </button>
            </div>
          </div>

          <!-- Contador de quantidade (apenas produtos) -->
          <div v-if="item.tipo === 'PRODUTO' && item.tamanho" class="mt-3 flex items-center gap-3">
            <label class="text-12 font-bold uppercase tracking-[0.1em] text-cinza-dtf shrink-0">
              Quantidade
            </label>
            <button
              type="button"
              @click="alterarQuantidade(item.id, -1)"
              :disabled="item.quantidade! <= 1"
              class="w-8 h-8 rounded-padrao border border-preto-dtf/20 flex items-center justify-center text-preto-dtf hover:bg-preto-dtf/5 transition-colors"
            >
              −
            </button>
            <span class="w-8 text-center text-14 font-bold text-preto-dtf">
              {{ item.quantidade }}
            </span>
            <button
              type="button"
              @click="alterarQuantidade(item.id, 1)"
              class="w-8 h-8 rounded-padrao border border-preto-dtf/20 flex items-center justify-center text-preto-dtf hover:bg-preto-dtf/5 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Botão confirmar compra -->
      <div class="mt-8">
        <BaseBotao
          variant="primario"
          :disabled="!algumSelecionado"
          @click="irParaCheckout"
        >
          Confirmar compra
        </BaseBotao>
      </div>
    </div>

    <!-- Modal de confirmação de remoção -->
    <BaseModalConfirmacao
      v-model:open="modalRemoverAberto"
      :titulo="'Remover item?'"
      :descricao="`Tem certeza que deseja remover ${itemRemoverNome} da sacola?`"
      :variante="'risco'"
      textoConfirmar="Remover"
      textoCancelar="Cancelar"
      @confirmar="confirmarRemover"
    />
  </div>
</template>
