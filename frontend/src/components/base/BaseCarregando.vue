<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue'

withDefaults(defineProps<{ texto?: string }>(), { texto: 'Carregando' })
</script>

<template>
  <div role="status" aria-live="polite" class="flex items-center justify-center p-5">
    <BaseSpinner class="size-6" />
    <span class="sr-only">{{ texto }}</span>
  </div>
</template>
