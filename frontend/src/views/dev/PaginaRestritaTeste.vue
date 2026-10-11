<script setup lang="ts">
import { ref } from 'vue'

import { MENSAGEM_GERAL } from '@/api/ErroApi'
import { api } from '@/api/http'
import BaseBotao from '@/components/base/BaseBotao.vue'
import { useSessao } from '@/stores/sessao'

const sessao = useSessao()
const resultado = ref('')

async function chamarApi() {
  resultado.value = ''
  try {
    await api.get('/me')
    resultado.value = 'OK'
  } catch {
    resultado.value = MENSAGEM_GERAL
  }
}
</script>

<template>
  <main class="flex flex-col items-start gap-5 p-12.5">
    <h1 class="text-32 font-bold">Página restrita</h1>
    <p>{{ sessao.usuario?.nome }}</p>
    <BaseBotao tamanho="compacto" @click="chamarApi">Chamar a API</BaseBotao>
    <p v-if="resultado">{{ resultado }}</p>
  </main>
</template>
