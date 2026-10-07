<script setup lang="ts">
import { computed } from 'vue'

import BaseSpinner from './BaseSpinner.vue'

type Variante = 'primario' | 'secundario' | 'risco'

const props = withDefaults(
  defineProps<{
    variante?: Variante
    tipo?: 'button' | 'submit'
    carregando?: boolean
    desabilitado?: boolean
  }>(),
  { variante: 'primario', tipo: 'button', carregando: false, desabilitado: false },
)

const classesPorVariante: Record<Variante, string> = {
  primario: 'bg-amarelo-dtf',
  secundario: 'bg-branco-dtf ring-1 ring-inset ring-preto-dtf',
  risco: 'bg-erro',
}

const classeDaVariante = computed(() => {
  if (props.desabilitado) return 'bg-cinza-escuro/67 cursor-not-allowed'
  return classesPorVariante[props.variante]
})
</script>

<template>
  <button
    :type="tipo"
    :disabled="desabilitado || carregando"
    :aria-busy="carregando || undefined"
    class="relative inline-flex items-center justify-center rounded-padrao px-4.25 py-2.25 text-24 font-semibold text-preto-dtf"
    :class="classeDaVariante"
  >
    <span
      class="inline-flex items-center justify-center gap-4.5"
      :class="{ 'opacity-0': carregando }"
    >
      <slot />
    </span>
    <BaseSpinner v-if="carregando" class="absolute size-6" />
  </button>
</template>
