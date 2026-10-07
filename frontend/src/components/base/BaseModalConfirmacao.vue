<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'

import BaseBotao from './BaseBotao.vue'

const props = withDefaults(
  defineProps<{
    titulo: string
    descricao: string
    textoConfirmar: string
    textoCancelar?: string
    variante?: 'risco' | 'primario'
    carregando?: boolean
  }>(),
  { textoCancelar: 'Cancelar', variante: 'risco', carregando: false },
)

const aberto = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ confirmar: [] }>()

const conteudo = useTemplateRef<InstanceType<typeof AlertDialogContent>>('conteudo')

watch(
  () => props.carregando,
  (ligado) => {
    if (ligado) conteudo.value?.$el.focus()
  },
)

function bloquearEscDuranteCarregamento(evento: KeyboardEvent) {
  if (props.carregando) evento.preventDefault()
}
</script>

<template>
  <AlertDialogRoot v-model:open="aberto">
    <AlertDialogTrigger v-if="$slots.gatilho" as-child>
      <slot name="gatilho" />
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-50 bg-preto-dtf/50" />
      <AlertDialogContent
        ref="conteudo"
        class="fixed top-1/2 left-1/2 z-50 flex w-100 max-w-[calc(100%-2.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5.5 rounded-padrao bg-branco-dtf p-6.25 ring-1 ring-cinza-escuro/67 outline-none ring-inset"
        @escape-key-down="bloquearEscDuranteCarregamento"
      >
        <div class="flex w-full flex-col gap-2.5 text-center text-preto-dtf">
          <AlertDialogTitle class="text-24 font-bold">{{ titulo }}</AlertDialogTitle>
          <AlertDialogDescription class="text-12">{{ descricao }}</AlertDialogDescription>
        </div>
        <div class="flex w-75 max-w-full justify-between gap-2.5">
          <AlertDialogCancel as-child>
            <BaseBotao
              variante="secundario"
              tamanho="compacto"
              :desabilitado="carregando"
              class="w-30"
            >
              {{ textoCancelar }}
            </BaseBotao>
          </AlertDialogCancel>
          <BaseBotao
            :variante="variante"
            tamanho="compacto"
            :carregando="carregando"
            class="w-30"
            @click="emit('confirmar')"
          >
            {{ textoConfirmar }}
          </BaseBotao>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
