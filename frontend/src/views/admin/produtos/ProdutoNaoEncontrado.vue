<script setup lang="ts">
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
</script>

<template>
  <BaseEstadoVazio titulo="Produto não encontrado." descricao="Ele pode ter sido removido.">
    <template #acao>
      <RouterLink
        :to="{ name: 'admin-produtos' }"
        class="inline-flex h-9.25 items-center justify-center rounded-padrao bg-branco-dtf px-2.5 text-13 font-bold whitespace-nowrap text-preto-dtf ring-1 ring-cinza-escuro/67 ring-inset"
      >
        Voltar para produtos
      </RouterLink>
    </template>
  </BaseEstadoVazio>
</template>
