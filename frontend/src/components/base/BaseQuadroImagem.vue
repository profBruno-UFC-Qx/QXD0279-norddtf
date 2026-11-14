<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'

import IconeGaleria from '@/components/icones/IconeGaleria.vue'

import BaseSpinner from './BaseSpinner.vue'

type Estado = 'vazio' | 'enviando' | 'enviado' | 'erro'

const props = defineProps<{
  rotulo: string
  estado: Estado
  url?: string
  mensagem?: string
}>()

const emit = defineEmits<{ escolher: [arquivo: File] }>()

const idMensagem = `${useId()}-mensagem`

const seletor = useTemplateRef<HTMLInputElement>('seletor')

const mostraImagem = computed(
  () => props.estado === 'enviado' || (props.estado === 'erro' && !!props.url),
)

const enviando = computed(() => props.estado === 'enviando')

const contorno = computed(() => {
  if (props.estado === 'erro') return 'ring-2 ring-erro'
  if (props.estado === 'enviado') return 'ring-1 ring-cinza-claro'
  return 'ring-1 ring-cinza-escuro/67'
})

const classesDoConteudo = computed(() => {
  if (enviando.value) return 'cursor-progress bg-cinza-claro'
  if (mostraImagem.value) return 'bg-branco-dtf p-1'
  return 'bg-branco-dtf text-12 font-medium text-cinza-dtf'
})

const nomeAcessivel = computed(() => {
  if (enviando.value) return `Enviando a imagem ${props.rotulo}`
  if (mostraImagem.value) return `Trocar a imagem ${props.rotulo}`
  return `Enviar a imagem ${props.rotulo}`
})

function abrirSeletor() {
  if (enviando.value) return
  seletor.value?.click()
}

function aoEscolher(evento: Event) {
  const alvo = evento.target as HTMLInputElement
  const arquivo = alvo.files?.[0]
  alvo.value = ''
  if (arquivo) emit('escolher', arquivo)
}
</script>

<template>
  <div class="flex w-21 flex-col items-center gap-1.25">
    <span class="min-h-7.5 text-center text-12 font-medium">{{ rotulo }}</span>
    <button
      type="button"
      class="flex h-20.5 w-16.5 flex-col items-center justify-center gap-1.25 rounded-padrao ring-inset"
      :class="[contorno, classesDoConteudo]"
      :aria-label="nomeAcessivel"
      :aria-busy="enviando || undefined"
      :aria-disabled="enviando || undefined"
      :aria-invalid="estado === 'erro' || undefined"
      :aria-describedby="mensagem ? idMensagem : undefined"
      @click="abrirSeletor"
    >
      <BaseSpinner v-if="enviando" class="size-6" />
      <img
        v-else-if="mostraImagem"
        :src="url"
        alt=""
        class="max-h-18.5 max-w-14.5 object-contain"
      />
      <template v-else>
        <IconeGaleria class="size-5" />
        Enviar
      </template>
    </button>
    <span v-if="mensagem" :id="idMensagem" class="sr-only">{{ mensagem }}</span>
    <input
      ref="seletor"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="hidden"
      tabindex="-1"
      @change="aoEscolher"
    />
  </div>
</template>
