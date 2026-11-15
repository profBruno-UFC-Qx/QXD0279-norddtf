<script setup lang="ts">
import { useId } from 'vue'

import type { CorDaLoja } from '@/types/produto'

defineProps<{ cores: CorDaLoja[]; corId: string | null }>()

const emit = defineEmits<{ escolher: [corId: string] }>()

const id = useId()
</script>

<template>
  <div role="group" :aria-labelledby="id" class="flex flex-col gap-5">
    <p :id="id" class="text-16">Cores disponíveis</p>
    <div class="flex flex-wrap gap-7.5">
      <button
        v-for="cor in cores"
        :key="cor.id"
        type="button"
        :aria-label="`Cor ${cor.nome}`"
        :aria-pressed="cor.id === corId"
        class="size-9.5 rounded-full inset-ring inset-ring-cinza-escuro/67 aria-pressed:ring-1 aria-pressed:ring-amarelo-dtf aria-pressed:ring-offset-2 aria-pressed:ring-offset-branco-dtf"
        :style="{ backgroundColor: cor.hex }"
        @click="emit('escolher', cor.id)"
      />
    </div>
  </div>
</template>
