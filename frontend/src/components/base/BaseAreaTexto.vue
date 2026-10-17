<script setup lang="ts">
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'

const props = withDefaults(
  defineProps<{
    nome: string
    rotulo: string
    linhas?: number
    placeholder?: string
    desabilitado?: boolean
    limite?: number
  }>(),
  { linhas: 4, desabilitado: false },
)

const id = useId()
const idErro = `${id}-erro`
const idContador = `${id}-contador`

const { value, errorMessage, handleBlur, handleChange } = useField<string>(
  () => props.nome,
  undefined,
  { validateOnValueUpdate: false },
)

const tamanho = computed(() => (value.value ?? '').length)

const idDescricao = computed(() => {
  const ids = [errorMessage.value && idErro, props.limite && idContador].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
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
      :maxlength="limite"
      :disabled="desabilitado"
      :aria-invalid="!!errorMessage || undefined"
      :aria-describedby="idDescricao"
      class="w-full resize-y rounded-padrao bg-cinza-claro p-2.5 text-12 placeholder:text-cinza-dtf disabled:cursor-not-allowed disabled:placeholder:text-cinza-escuro aria-invalid:ring-2 aria-invalid:ring-erro aria-invalid:ring-inset"
      @input="handleChange(($event.target as HTMLTextAreaElement).value, !!errorMessage)"
      @blur="handleBlur($event, true)"
    />
    <div v-if="errorMessage || limite" class="flex justify-between gap-2.5 text-12">
      <p v-if="errorMessage" :id="idErro" class="text-erro">{{ errorMessage }}</p>
      <p v-if="limite" :id="idContador" class="ml-auto text-cinza-dtf">
        {{ tamanho }}/{{ limite }}
      </p>
    </div>
  </div>
</template>
