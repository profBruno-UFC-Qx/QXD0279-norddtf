<script setup lang="ts">
import IconeErro from '@/components/icones/IconeErro.vue'
</script>

<template>
  <div
    role="alert"
    class="flex items-center gap-2.5 rounded-padrao bg-branco-dtf p-2.5 text-16 font-semibold text-preto-dtf ring-2 ring-erro ring-inset"
  >
    <IconeErro class="size-6 shrink-0 text-erro" />
    <p>
      <slot />
    </p>
  </div>
</template>
