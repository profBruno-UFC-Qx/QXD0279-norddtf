<script setup lang="ts">
import { useId, useTemplateRef } from 'vue'

type Tamanho = 'compacto' | 'padrao'

withDefaults(
  defineProps<{
    rotulo?: string
    tamanho?: Tamanho
    desabilitado?: boolean
  }>(),
  { rotulo: 'Situação do produto', tamanho: 'padrao', desabilitado: false },
)

const ativo = defineModel<boolean>({ required: true })

const nome = useId()

const classesPorTamanho: Record<Tamanho, string> = {
  compacto: 'h-6.5 text-12',
  padrao: 'h-8.75 text-13',
}

const opcoes = [
  { valor: true, rotulo: 'Ativo', marcado: 'has-checked:bg-sucesso' },
  { valor: false, rotulo: 'Inativo', marcado: 'has-checked:bg-cinza-escuro' },
]

const entradas = useTemplateRef<HTMLInputElement[]>('entradas')

function escolher(valor: boolean) {
  const anterior = String(ativo.value)
  ativo.value = valor
  // O rádio só muda quando o v-model mudar: a tela pode recusar a troca.
  entradas.value?.forEach((entrada) => {
    entrada.checked = entrada.value === anterior
  })
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="rotulo"
    class="flex w-full overflow-hidden rounded-padrao border border-cinza-escuro/67"
    :class="classesPorTamanho[tamanho]"
  >
    <label
      v-for="opcao in opcoes"
      :key="opcao.rotulo"
      class="flex flex-1 cursor-pointer items-center justify-center bg-branco-dtf font-bold text-preto-dtf has-disabled:cursor-not-allowed has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-preto-dtf"
      :class="opcao.marcado"
    >
      <input
        ref="entradas"
        type="radio"
        :name="nome"
        :value="String(opcao.valor)"
        :checked="ativo === opcao.valor"
        :disabled="desabilitado"
        class="sr-only"
        @change="escolher(opcao.valor)"
      />
      {{ opcao.rotulo }}
    </label>
  </div>
</template>
