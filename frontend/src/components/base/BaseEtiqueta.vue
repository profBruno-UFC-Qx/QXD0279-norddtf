<script setup lang="ts">
import IconeFechar from '@/components/icones/IconeFechar.vue'

defineProps<{ texto: string }>()

const emit = defineEmits<{ remover: [] }>()
</script>

<template>
  <span
    class="inline-flex h-5.75 items-center gap-2.5 rounded-padrao bg-amarelo-dtf/25 px-2 text-14 font-medium ring-1 ring-amarelo-dtf ring-inset"
  >
    {{ texto }}
    <button
      type="button"
      class="grid size-3.5 place-items-center"
      :aria-label="`Remover filtro ${texto}`"
      @click="emit('remover')"
    >
      <IconeFechar class="size-3.5" />
    </button>
  </span>
</template>
