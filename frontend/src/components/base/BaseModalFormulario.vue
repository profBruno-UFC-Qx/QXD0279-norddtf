<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

import BaseBotao from './BaseBotao.vue'
import BaseMensagem from './BaseMensagem.vue'

const props = withDefaults(
  defineProps<{
    titulo: string
    descricao?: string
    textoConfirmar: string
    textoCancelar?: string
    carregando?: boolean
    erro?: string
  }>(),
  { textoCancelar: 'Cancelar', carregando: false },
)

const aberto = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ enviar: [] }>()

const conteudo = useTemplateRef<InstanceType<typeof DialogContent>>('conteudo')
const botaoEnviar = useTemplateRef<InstanceType<typeof BaseBotao>>('botaoEnviar')

watch(
  () => props.carregando,
  (ligado) => {
    if (ligado && document.activeElement === botaoEnviar.value?.$el) conteudo.value?.$el.focus()
  },
)

function bloquearDuranteCarregamento(evento: Event) {
  if (props.carregando) evento.preventDefault()
}
</script>

<template>
  <DialogRoot v-model:open="aberto">
    <DialogTrigger v-if="$slots.gatilho" as-child>
      <slot name="gatilho" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-preto-dtf/50" />
      <DialogContent
        ref="conteudo"
        v-bind="descricao ? {} : { 'aria-describedby': undefined }"
        class="fixed top-1/2 left-1/2 z-50 w-100 max-w-[calc(100%-2.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-padrao bg-branco-dtf p-6.25 text-preto-dtf ring-1 ring-cinza-escuro/67 outline-none ring-inset"
        @escape-key-down="bloquearDuranteCarregamento"
        @interact-outside="bloquearDuranteCarregamento"
      >
        <form
          novalidate
          class="flex flex-col items-center gap-5.5"
          @submit.prevent="emit('enviar')"
        >
          <div class="flex w-full flex-col gap-2.5 text-center">
            <DialogTitle class="text-24 font-bold">{{ titulo }}</DialogTitle>
            <DialogDescription v-if="descricao" class="text-12">{{ descricao }}</DialogDescription>
          </div>
          <div class="flex w-full flex-col gap-3.75">
            <slot />
          </div>
          <BaseMensagem v-if="erro" class="w-full">{{ erro }}</BaseMensagem>
          <div class="flex w-75 max-w-full justify-between gap-2.5">
            <DialogClose as-child>
              <BaseBotao
                variante="secundario"
                tamanho="compacto"
                :desabilitado="carregando"
                class="w-30"
              >
                {{ textoCancelar }}
              </BaseBotao>
            </DialogClose>
            <BaseBotao
              ref="botaoEnviar"
              tipo="submit"
              tamanho="compacto"
              :carregando="carregando"
              class="w-30"
            >
              {{ textoConfirmar }}
            </BaseBotao>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
