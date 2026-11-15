<script setup lang="ts">
import { computed, useId } from 'vue'

import BaseContador from '@/components/base/BaseContador.vue'
import type { EntradaDeEstoque } from '@/types/produto'

const props = defineProps<{ estoque: EntradaDeEstoque[] }>()

const quantidades = defineModel<EntradaDeEstoque[]>({ required: true })

const id = useId()

const legenda = computed(() =>
  props.estoque.some((entrada) => entrada.tamanho)
    ? 'Indique as quantidades'
    : 'Indique a quantidade',
)

function rotulo({ tamanho, quantidade }: EntradaDeEstoque) {
  const nome = tamanho ? `quantidade do tamanho ${tamanho}` : 'quantidade'
  return quantidade === 0 ? `${nome}, esgotado` : nome
}

function mudar(indice: number, valor: number | null) {
  quantidades.value = quantidades.value.map((entrada, posicao) =>
    posicao === indice ? { ...entrada, quantidade: valor ?? 0 } : entrada,
  )
}
</script>

<template>
  <div role="group" :aria-labelledby="id" class="flex flex-col gap-5">
    <p :id="id" class="text-16">{{ legenda }}</p>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-x-5 gap-y-3.75">
      <div
        v-for="(entrada, indice) in estoque"
        :key="entrada.tamanho ?? 'unidades'"
        class="flex flex-col items-start gap-1.25"
      >
        <p
          v-if="entrada.tamanho"
          class="flex items-baseline gap-1.25 text-12 font-medium whitespace-nowrap"
        >
          {{ entrada.tamanho }}
          <span v-if="entrada.quantidade === 0" class="font-normal text-cinza-dtf">Esgotado</span>
        </p>
        <BaseContador
          :rotulo="rotulo(entrada)"
          :maximo="entrada.quantidade"
          :desabilitado="entrada.quantidade === 0"
          :model-value="quantidades[indice]?.quantidade ?? 0"
          @update:model-value="mudar(indice, $event)"
        />
      </div>
    </div>
  </div>
</template>
