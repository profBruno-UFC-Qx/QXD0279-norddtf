<script setup lang="ts">
import { useSessao } from '@/stores/sessao'

const mensagem = useSessao().consumirMensagemLogin()
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <p v-if="mensagem" role="alert" class="text-14 font-medium text-erro">{{ mensagem }}</p>
    <p>Tela de login na próxima fase.</p>
  </div>
</template>
