<script setup lang="ts">
import { computed } from 'vue'

import IconeContadorMais from '@/components/icones/IconeContadorMais.vue'
import IconeContadorMenos from '@/components/icones/IconeContadorMenos.vue'
import { somenteDigitos } from '@/utils/formatacao'

const MINIMO = 0
const MAXIMO = 99999

const props = withDefaults(
  defineProps<{ rotulo: string; invalido?: boolean; maximo?: number; desabilitado?: boolean }>(),
  { invalido: false, desabilitado: false },
)

const quantidade = defineModel<number | null>({ required: true })

const limite = computed(() => props.maximo ?? MAXIMO)

const marcado = computed(() => {
  if (props.invalido) return true
  return quantidade.value !== null && quantidade.value > limite.value
})

const podeDiminuir = computed(
  () => !props.desabilitado && quantidade.value !== null && quantidade.value > MINIMO,
)
const podeAumentar = computed(
  () => !props.desabilitado && (quantidade.value ?? MINIMO) < limite.value,
)

function diminuir() {
  quantidade.value = Math.min((quantidade.value ?? MINIMO) - 1, limite.value)
}

function aumentar() {
  quantidade.value = (quantidade.value ?? MINIMO) + 1
}

// Sem maximo explícito, o valor acima de 99999 fica no campo para o esquema do admin mostrar o erro.
function digitado(texto: string) {
  const digitos = somenteDigitos(texto)
  if (digitos === '' || props.maximo === undefined) return digitos
  return String(Math.min(Number(digitos), props.maximo))
}

function aoDigitar(evento: Event) {
  const alvo = evento.target as HTMLInputElement
  const texto = digitado(alvo.value)
  if (alvo.value !== texto) alvo.value = texto
  quantidade.value = texto === '' ? null : Number(texto)
}
</script>

<template>
  <span
    class="inline-flex h-6.5 items-center rounded-padrao ring-inset"
    :class="[
      marcado ? 'ring-2 ring-erro' : 'ring-1 ring-cinza-escuro/67',
      desabilitado ? 'bg-cinza-claro' : 'bg-branco-dtf',
    ]"
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
      :disabled="desabilitado"
      class="h-6 w-7 bg-transparent text-center text-13 font-bold outline-offset-0 disabled:text-cinza-escuro"
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
