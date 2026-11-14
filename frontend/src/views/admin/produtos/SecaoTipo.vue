<script setup lang="ts">
import BaseSelecao from '@/components/base/BaseSelecao.vue'
import type { TipoProduto } from '@/types/produto'

const opcoes: { valor: TipoProduto; rotulo: string }[] = [
  { valor: 'PERSONALIZAVEL', rotulo: 'Personalizável' },
  { valor: 'VENDA_DIRETA', rotulo: 'Venda direta' },
]
</script>

<template>
  <BaseSelecao nome="tipo" rotulo="Tipo de produto" :opcoes="opcoes" class="w-50 shrink-0" />
</template>
