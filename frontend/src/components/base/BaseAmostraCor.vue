<script setup lang="ts">
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'

const props = defineProps<{ nome: string; rotulo: string }>()

const HEXADECIMAL = /^#[0-9A-F]{6}$/i
// Quase branco: com #ffffff, escolher branco numa cor nova não dispara input.
const SEM_COR = '#fffffe'

const id = useId()
const idRotulo = `${id}-rotulo`
const idErro = `${id}-erro`

const { value, errorMessage, handleBlur, handleChange } = useField<string>(
  () => props.nome,
  undefined,
  { validateOnValueUpdate: false },
)

const corValida = computed(() => {
  const valor = value.value ?? ''
  return HEXADECIMAL.test(valor) ? valor : undefined
})

function guardar(valor: string) {
  handleChange(valor.toUpperCase(), !!errorMessage.value)
}

function aoDigitar(evento: Event) {
  const alvo = evento.target as HTMLInputElement
  const { selectionStart, selectionEnd } = alvo
  alvo.value = alvo.value.toUpperCase()
  alvo.setSelectionRange(selectionStart, selectionEnd)
  guardar(alvo.value)
}
</script>

<template>
  <div role="group" :aria-labelledby="idRotulo" class="flex flex-col gap-1.25">
    <span :id="idRotulo" class="text-14 font-medium">{{ rotulo }}</span>
    <div class="flex gap-2.5">
      <input
        type="color"
        :value="corValida?.toLowerCase() ?? SEM_COR"
        aria-label="Escolher a cor da amostra"
        class="size-9.5 shrink-0 cursor-pointer rounded-padrao p-0 [&::-moz-color-swatch]:rounded-padrao [&::-moz-color-swatch]:border-cinza-escuro/67 [&::-webkit-color-swatch]:rounded-padrao [&::-webkit-color-swatch]:border-cinza-escuro/67 [&::-webkit-color-swatch-wrapper]:p-0"
        @input="guardar(($event.target as HTMLInputElement).value)"
      />
      <input
        type="text"
        :name="nome"
        :value="value ?? ''"
        maxlength="7"
        placeholder="#000000"
        aria-label="Código hexadecimal da amostra"
        :aria-invalid="!!errorMessage || undefined"
        :aria-describedby="errorMessage ? idErro : undefined"
        class="h-9.5 min-w-0 flex-1 rounded-padrao bg-cinza-claro px-2.5 text-12 placeholder:text-cinza-dtf aria-invalid:ring-2 aria-invalid:ring-erro aria-invalid:ring-inset"
        @input="aoDigitar"
        @blur="handleBlur($event, true)"
      />
    </div>
    <p v-if="errorMessage" :id="idErro" class="text-12 text-erro">{{ errorMessage }}</p>
  </div>
</template>
