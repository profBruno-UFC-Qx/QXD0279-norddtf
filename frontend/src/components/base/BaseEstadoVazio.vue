<script setup lang="ts">
defineProps<{ titulo: string; descricao?: string }>()
</script>

<template>
  <div
    class="flex w-full flex-col items-center gap-2.5 rounded-padrao p-2.5 ring-1 ring-cinza-claro ring-inset text-center text-preto-dtf"
  >
    <p class="font-destaque text-16 font-extrabold">{{ titulo }}</p>
    <p v-if="descricao" class="text-12 font-medium">{{ descricao }}</p>
    <slot name="acao" />
  </div>
</template>
