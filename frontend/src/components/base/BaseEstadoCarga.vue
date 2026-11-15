<script setup lang="ts">
import { MENSAGEM_GERAL } from '@/api/ErroApi'
import BaseBotao from './BaseBotao.vue'
import BaseCarregando from './BaseCarregando.vue'
import BaseMensagem from './BaseMensagem.vue'

defineProps<{ estado: 'carregando' | 'erro' }>()

const emit = defineEmits<{ tentarNovamente: [] }>()
</script>

<template>
  <div v-if="estado === 'erro'" class="flex flex-col items-start gap-3.75">
    <BaseMensagem class="w-full">{{ MENSAGEM_GERAL }}</BaseMensagem>
    <BaseBotao
      variante="secundario"
      tamanho="compacto"
      class="w-35"
      @click="emit('tentarNovamente')"
    >
      Tentar novamente
    </BaseBotao>
  </div>
  <div
    v-else
    class="flex h-50 items-center justify-center rounded-padrao ring-1 ring-cinza-escuro/67 ring-inset"
  >
    <BaseCarregando />
  </div>
</template>
