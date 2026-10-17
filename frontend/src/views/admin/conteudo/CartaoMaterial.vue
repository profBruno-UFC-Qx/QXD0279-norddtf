<script setup lang="ts">
import BaseBotao from '@/components/base/BaseBotao.vue'
import type { Material } from '@/types/material'
import { formatarMoeda } from '@/utils/formatacao'

defineProps<{ material: Material; nome: string }>()

const emit = defineEmits<{ editar: [] }>()
</script>

<template>
  <article class="flex flex-col gap-3.75 rounded-padrao p-5 ring-1 ring-cinza-escuro/67 ring-inset">
    <div class="flex items-baseline justify-between gap-2.5">
      <h2 class="text-24 font-bold">{{ nome }}</h2>
      <p class="font-destaque text-24 font-extrabold whitespace-nowrap">
        {{ formatarMoeda(material.precoPorM2) }}/m²
      </p>
    </div>
    <span class="self-start rounded-padrao bg-cinza-escuro/25 px-3.25 py-1 text-12 font-medium">
      {{ material.etiqueta }}
    </span>
    <p class="text-14 wrap-break-word">{{ material.descricao }}</p>
    <div class="mt-auto flex justify-end">
      <BaseBotao
        variante="secundario"
        tamanho="compacto"
        class="w-30"
        :aria-label="`Editar ${nome}`"
        @click="emit('editar')"
      >
        Editar
      </BaseBotao>
    </div>
  </article>
</template>
