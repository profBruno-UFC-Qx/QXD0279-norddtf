<script setup lang="ts">
import { useId } from 'vue'
import { useField } from 'vee-validate'

const props = withDefaults(
  defineProps<{
    nome: string
    rotulo: string
    linhas?: number
    placeholder?: string
    desabilitado?: boolean
  }>(),
  { linhas: 4, desabilitado: false },
)

const id = useId()
const idErro = `${id}-erro`

const { value, errorMessage, handleBlur, handleChange } = useField<string>(
  () => props.nome,
  undefined,
  { validateOnValueUpdate: false },
)
</script>

<template>
  <div class="flex flex-col gap-1.25" :class="{ 'text-cinza-escuro': desabilitado }">
    <label :for="id" class="text-14 font-medium">{{ rotulo }}</label>
    <textarea
      :id="id"
      :name="nome"
      :value="value ?? ''"
      :rows="linhas"
      :placeholder="placeholder"
      :disabled="desabilitado"
      :aria-invalid="!!errorMessage || undefined"
      :aria-describedby="errorMessage ? idErro : undefined"
      class="w-full resize-y rounded-padrao bg-cinza-claro p-2.5 text-12 placeholder:text-cinza-dtf disabled:cursor-not-allowed disabled:placeholder:text-cinza-escuro aria-invalid:ring-2 aria-invalid:ring-erro aria-invalid:ring-inset"
      @input="handleChange(($event.target as HTMLTextAreaElement).value, !!errorMessage)"
      @blur="handleBlur($event, true)"
    />
    <p v-if="errorMessage" :id="idErro" class="text-12 text-erro">{{ errorMessage }}</p>
  </div>
</template>
