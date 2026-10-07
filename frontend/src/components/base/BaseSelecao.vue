<script setup lang="ts">
import { useId } from 'vue'
import { useField } from 'vee-validate'

const props = withDefaults(
  defineProps<{
    nome: string
    rotulo: string
    opcoes: { valor: string; rotulo: string }[]
    placeholder?: string
    desabilitado?: boolean
  }>(),
  { desabilitado: false },
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
    <select
      :id="id"
      :name="nome"
      :value="value ?? ''"
      :disabled="desabilitado"
      :aria-invalid="!!errorMessage || undefined"
      :aria-describedby="errorMessage ? idErro : undefined"
      class="h-9.5 w-full rounded-padrao bg-cinza-claro px-2.5 text-12 disabled:cursor-not-allowed aria-invalid:ring-2 aria-invalid:ring-erro aria-invalid:ring-inset"
      :class="{ 'text-cinza-dtf': !value && !desabilitado }"
      @change="handleChange(($event.target as HTMLSelectElement).value, !!errorMessage)"
      @blur="handleBlur($event, true)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opcao in opcoes" :key="opcao.valor" :value="opcao.valor">
        {{ opcao.rotulo }}
      </option>
    </select>
    <p v-if="errorMessage" :id="idErro" class="text-12 text-erro">{{ errorMessage }}</p>
  </div>
</template>
