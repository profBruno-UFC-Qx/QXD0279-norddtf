<script setup lang="ts">
import { computed } from 'vue'

import IconeContadorMais from '@/components/icones/IconeContadorMais.vue'
import IconeContadorMenos from '@/components/icones/IconeContadorMenos.vue'
import { somenteDigitos } from '@/utils/formatacao'

const MINIMO = 0
const MAXIMO = 99999

const props = withDefaults(defineProps<{ rotulo: string; invalido?: boolean }>(), {
  invalido: false,
})

const quantidade = defineModel<number | null>({ required: true })

const marcado = computed(() => {
  if (props.invalido) return true
  return quantidade.value !== null && quantidade.value > MAXIMO
})

const podeDiminuir = computed(() => quantidade.value !== null && quantidade.value > MINIMO)
const podeAumentar = computed(() => quantidade.value === null || quantidade.value < MAXIMO)

function diminuir() {
  quantidade.value = Math.min((quantidade.value ?? MINIMO) - 1, MAXIMO)
}

function aumentar() {
  quantidade.value = (quantidade.value ?? MINIMO) + 1
}

function aoDigitar(evento: Event) {
  const alvo = evento.target as HTMLInputElement
  const digitos = somenteDigitos(alvo.value)
  if (alvo.value !== digitos) alvo.value = digitos
  quantidade.value = digitos === '' ? null : Number(digitos)
}
</script>

<template>
  <span
    class="inline-flex h-6.5 items-center rounded-padrao bg-branco-dtf ring-inset"
    :class="marcado ? 'ring-2 ring-erro' : 'ring-1 ring-cinza-escuro/67'"
  >
    <button
      type="button"
      class="grid h-6 w-5 place-items-center text-cinza-dtf disabled:cursor-not-allowed disabled:text-cinza-escuro"
      :aria-label="`Diminuir ${rotulo}`"
      :disabled="!podeDiminuir"
      @click="diminuir"
    >
      <IconeContadorMenos class="size-3" />
    </button>
    <input
      type="text"
      inputmode="numeric"
      :value="quantidade ?? ''"
      :aria-label="rotulo"
      :aria-invalid="marcado || undefined"
      class="h-6 w-7 bg-transparent text-center text-13 font-bold outline-offset-0"
      @input="aoDigitar"
    />
    <button
      type="button"
      class="grid h-6 w-5 place-items-center text-cinza-dtf disabled:cursor-not-allowed disabled:text-cinza-escuro"
      :aria-label="`Aumentar ${rotulo}`"
      :disabled="!podeAumentar"
      @click="aumentar"
    >
      <IconeContadorMais class="size-3" />
    </button>
  </span>
</template>
