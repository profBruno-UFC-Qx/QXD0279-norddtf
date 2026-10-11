<script setup lang="ts">
import { useRoute } from 'vue-router'

import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'

const route = useRoute()
</script>

<template>
  <BaseEstadoVazio :titulo="route.meta.titulo" descricao="Esta tela chega numa próxima fase." />
</template>
