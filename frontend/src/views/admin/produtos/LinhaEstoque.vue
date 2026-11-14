<script setup lang="ts">
import { computed } from 'vue'
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from 'reka-ui'

import BaseContador from '@/components/base/BaseContador.vue'
import IconeLixeira from '@/components/icones/IconeLixeira.vue'
import IconeSetaBaixo from '@/components/icones/IconeSetaBaixo.vue'
import { TAMANHOS } from '@/types/produto'
import type { LinhaDeEstoque } from './esquemaProduto'

type OpcaoDeCor = { idLocal: string; nome: string; hex: string }

const props = defineProps<{
  linha: LinhaDeEstoque
  temTamanho: boolean
  opcoes: OpcaoDeCor[]
  invalidas: boolean[]
  mensagem?: string
}>()

const emit = defineEmits<{
  trocarCor: [cor: string]
  mudarQuantidade: [posicao: number, quantidade: number | null]
  remover: []
}>()

const corEscolhida = computed(() => props.opcoes.find((opcao) => opcao.idLocal === props.linha.cor))
const nomeDaCor = computed(() => corEscolhida.value?.nome ?? '')

function aoEscolher(valor: unknown) {
  if (typeof valor === 'string') emit('trocarCor', valor)
}
</script>

<template>
  <div class="overflow-hidden rounded-padrao ring-1 ring-cinza-escuro/67 ring-inset">
    <div
      class="flex items-center justify-between gap-5 bg-cinza-claro p-2.5"
      :class="{ 'border-b border-cinza-escuro/67': temTamanho }"
    >
      <SelectRoot :model-value="linha.cor" @update:model-value="aoEscolher">
        <SelectTrigger
          :aria-label="`Cor do estoque: ${nomeDaCor}`"
          class="flex h-8.5 w-73.25 max-w-full min-w-0 items-center justify-between gap-2.5 rounded-padrao bg-branco-dtf px-2.5 text-14"
        >
          <span class="flex min-w-0 items-center gap-5">
            <span
              aria-hidden="true"
              class="size-6 shrink-0 rounded-full ring-1 ring-cinza-escuro/67 ring-inset"
              :style="{ backgroundColor: corEscolhida?.hex }"
            />
            <span class="truncate">{{ nomeDaCor }}</span>
          </span>
          <IconeSetaBaixo class="size-3.5 shrink-0" />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            position="popper"
            :side-offset="5"
            class="z-50 w-(--reka-select-trigger-width) rounded-padrao bg-branco-dtf p-1.25 ring-1 ring-cinza-escuro/67 ring-inset"
          >
            <SelectViewport class="max-h-47.5">
              <SelectItem
                v-for="opcao in opcoes"
                :key="opcao.idLocal"
                :value="opcao.idLocal"
                class="flex h-8 cursor-pointer items-center gap-5 rounded-padrao px-2.5 text-14 outline-none data-highlighted:bg-cinza-claro"
              >
                <span
                  aria-hidden="true"
                  class="size-6 shrink-0 rounded-full ring-1 ring-cinza-escuro/67 ring-inset"
                  :style="{ backgroundColor: opcao.hex }"
                />
                <SelectItemText class="truncate">{{ opcao.nome }}</SelectItemText>
              </SelectItem>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
      <div v-if="!temTamanho" class="flex shrink-0 items-center gap-5 text-14">
        Estoque
        <BaseContador
          :model-value="linha.quantidades[0] ?? null"
          :rotulo="`Estoque de ${nomeDaCor}`"
          :invalido="invalidas[0]"
          @update:model-value="emit('mudarQuantidade', 0, $event)"
        />
        <button
          type="button"
          class="grid size-6 place-items-center text-erro"
          :aria-label="`Remover o estoque de ${nomeDaCor}`"
          @click="emit('remover')"
        >
          <IconeLixeira class="size-4" />
        </button>
      </div>
    </div>
    <table v-if="temTamanho" class="w-full table-fixed border-collapse text-14">
      <caption class="sr-only">
        Estoque de
        {{
          nomeDaCor
        }}
        por tamanho
      </caption>
      <colgroup>
        <col class="w-21" />
        <col v-for="tamanho in TAMANHOS" :key="tamanho" />
        <col class="w-18.75" />
      </colgroup>
      <thead>
        <tr class="h-7.25 border-b border-cinza-escuro/67 bg-cinza-claro">
          <th scope="col" class="pl-5 text-left font-normal">Tamanho</th>
          <th v-for="tamanho in TAMANHOS" :key="tamanho" scope="col" class="font-normal">
            {{ tamanho }}
          </th>
          <th scope="col" class="pr-5 text-right font-normal">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr class="h-9.25">
          <th scope="row" class="pl-5 text-left font-normal">Estoque</th>
          <td v-for="(tamanho, posicao) in TAMANHOS" :key="tamanho" class="text-center">
            <BaseContador
              :model-value="linha.quantidades[posicao] ?? null"
              :rotulo="`Estoque de ${nomeDaCor} no tamanho ${tamanho}`"
              :invalido="invalidas[posicao]"
              @update:model-value="emit('mudarQuantidade', posicao, $event)"
            />
          </td>
          <td class="pr-5 text-right">
            <button
              type="button"
              class="inline-grid size-6 place-items-center align-middle text-erro"
              :aria-label="`Remover o estoque de ${nomeDaCor}`"
              @click="emit('remover')"
            >
              <IconeLixeira class="size-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="mensagem" class="px-5 pb-2 text-12 text-erro" :class="{ 'pt-2': !temTamanho }">
      {{ mensagem }}
    </p>
  </div>
</template>
