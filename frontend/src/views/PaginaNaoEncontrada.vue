<script setup lang="ts">
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
</script>

<template>
  <BaseEstadoVazio titulo="Página não encontrada">
    <template #acao>
      <RouterLink to="/" class="text-14 font-semibold underline">Voltar para a loja</RouterLink>
    </template>
  </BaseEstadoVazio>
</template>
