<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

type Variante = 'primario' | 'escuro' | 'contorno' | 'contornoClaro'
type Tamanho = 'padrao' | 'compacto' | 'grande'

const props = withDefaults(
  defineProps<{
    para?: RouteLocationRaw
    href?: string
    variante?: Variante
    tamanho?: Tamanho
  }>(),
  {
    para: undefined,
    href: undefined,
    variante: 'primario',
    tamanho: 'padrao',
  },
)

const classesPorVariante: Record<Variante, string> = {
  primario: 'bg-amarelo-dtf text-preto-dtf hover:bg-[#ffc233]',
  escuro: 'bg-preto-dtf text-branco-dtf hover:bg-cinza-dtf',
  contorno:
    'text-preto-dtf ring-1 ring-preto-dtf ring-inset hover:bg-preto-dtf hover:text-branco-dtf',
  contornoClaro:
    'text-branco-dtf ring-1 ring-branco-dtf/40 ring-inset hover:bg-branco-dtf hover:text-preto-dtf',
}

const classesPorTamanho: Record<Tamanho, string> = {
  padrao: 'min-h-12 px-6 text-16',
  compacto: 'min-h-10 px-4 text-14',
  grande: 'min-h-14 px-8 text-16',
}

const classes = computed(() => [
  classesPorVariante[props.variante],
  classesPorTamanho[props.tamanho],
])
</script>

<template>
  <component
    :is="para ? RouterLink : 'a'"
    v-bind="para ? { to: para } : { href }"
    class="inline-flex items-center justify-center gap-2 rounded-padrao font-bold transition-colors duration-150"
    :class="classes"
  >
    <slot />
  </component>
</template>
