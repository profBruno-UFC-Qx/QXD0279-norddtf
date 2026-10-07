<script setup lang="ts">
import { useId } from 'vue'
import { useField } from 'vee-validate'

const props = withDefaults(
  defineProps<{
    nome: string
    rotulo: string
    desabilitado?: boolean
  }>(),
  { desabilitado: false },
)

const id = useId()
const idErro = `${id}-erro`

const { checked, errorMessage, handleChange } = useField<boolean>(() => props.nome, undefined, {
  type: 'checkbox',
  checkedValue: true,
  uncheckedValue: false,
})
</script>

<template>
  <div class="flex flex-col gap-1.25" :class="{ 'text-cinza-escuro': desabilitado }">
    <div class="flex items-center gap-2.5">
      <input
        :id="id"
        type="checkbox"
        :name="nome"
        :checked="checked"
        :disabled="desabilitado"
        :aria-invalid="!!errorMessage || undefined"
        :aria-describedby="errorMessage ? idErro : undefined"
        class="size-4 accent-amarelo-dtf disabled:cursor-not-allowed aria-invalid:ring-2 aria-invalid:ring-erro"
        @change="handleChange"
      />
      <label :for="id" class="text-14 font-medium" :class="{ 'cursor-not-allowed': desabilitado }">
        {{ rotulo }}
      </label>
    </div>
    <p v-if="errorMessage" :id="idErro" class="text-12 text-erro">{{ errorMessage }}</p>
  </div>
</template>
