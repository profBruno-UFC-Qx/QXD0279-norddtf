<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ToastDescription, ToastProvider, ToastRoot, ToastViewport } from 'reka-ui'

import IconeErro from '@/components/icones/IconeErro.vue'
import IconeSucesso from '@/components/icones/IconeSucesso.vue'
import { useAvisos, type TipoAviso } from '@/stores/avisos'

const avisos = useAvisos()

const visualPorTipo: Record<TipoAviso, { icone: Component; cor: string; borda: string }> = {
  sucesso: { icone: IconeSucesso, cor: 'text-sucesso', borda: 'ring-cinza-claro' },
  erro: { icone: IconeErro, cor: 'text-erro', borda: 'ring-erro' },
}

const mensagemAnunciada = computed(() => avisos.avisos.at(-1)?.mensagem ?? '')

function aoMudarAbertura(id: number, aberto: boolean) {
  if (!aberto) avisos.remover(id)
}
</script>

<template>
  <ToastProvider label="Aviso" :duration="4000">
    <ToastRoot
      v-for="aviso in avisos.avisos"
      :key="aviso.id"
      class="pointer-events-auto flex w-103 max-w-full flex-col items-center rounded-padrao bg-branco-dtf p-2.5 ring-2 ring-inset"
      :class="visualPorTipo[aviso.tipo].borda"
      @update:open="(aberto) => aoMudarAbertura(aviso.id, aberto)"
    >
      <component
        :is="visualPorTipo[aviso.tipo].icone"
        class="-mb-1.25 size-12"
        :class="visualPorTipo[aviso.tipo].cor"
      />
      <ToastDescription class="text-center text-24 font-semibold text-preto-dtf">
        {{ aviso.mensagem }}
      </ToastDescription>
    </ToastRoot>
    <ToastViewport
      label="Avisos ({hotkey})"
      class="pointer-events-none fixed inset-x-0 top-0 z-60 flex flex-col items-center gap-2.5 p-3.5"
    />
  </ToastProvider>
  <div role="status" aria-live="polite" class="sr-only">{{ mensagemAnunciada }}</div>
</template>
