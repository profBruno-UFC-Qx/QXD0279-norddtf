<script setup lang="ts">
import { computed, ref, useId, type Component } from 'vue'
import { useField } from 'vee-validate'

import IconeOlho from '@/components/icones/IconeOlho.vue'
import IconeOlhoFechado from '@/components/icones/IconeOlhoFechado.vue'
import { somenteDigitos } from '@/utils/formatacao'
import { mascararCep, mascararTelefone } from '@/utils/mascaras'

type Mascara = 'telefone' | 'cep'

const props = withDefaults(
  defineProps<{
    nome: string
    rotulo: string
    tipo?: 'text' | 'email' | 'password' | 'tel'
    icone?: Component
    mascara?: Mascara
    placeholder?: string
    autocomplete?: string
    desabilitado?: boolean
  }>(),
  { tipo: 'text', desabilitado: false },
)

const mascaras: Record<Mascara, (valor: string) => string> = {
  telefone: mascararTelefone,
  cep: mascararCep,
}

const id = useId()
const idErro = `${id}-erro`

const { value, errorMessage, handleBlur, handleChange } = useField<string>(
  () => props.nome,
  undefined,
  { validateOnValueUpdate: false },
)

const senhaVisivel = ref(false)
const ehSenha = computed(() => props.tipo === 'password')
const tipoDoInput = computed(() => (ehSenha.value && senhaVisivel.value ? 'text' : props.tipo))

const valorExibido = computed(() => {
  const valor = value.value ?? ''
  if (!props.mascara) return valor
  return mascaras[props.mascara](valor)
})

function aoDigitar(evento: Event) {
  const alvo = evento.target as HTMLInputElement
  if (!props.mascara) {
    handleChange(alvo.value, !!errorMessage.value)
    return
  }
  const mascarado = mascaras[props.mascara](alvo.value)
  handleChange(somenteDigitos(mascarado), !!errorMessage.value)
  if (alvo.value !== mascarado) alvo.value = mascarado
}
</script>

<template>
  <div class="flex flex-col gap-1.25" :class="{ 'text-cinza-escuro': desabilitado }">
    <label :for="id" class="text-14 font-medium">{{ rotulo }}</label>
    <div class="relative">
      <component
        :is="icone"
        v-if="icone"
        class="pointer-events-none absolute top-1/2 left-2.5 size-6 -translate-y-1/2"
      />
      <input
        :id="id"
        :name="nome"
        :type="tipoDoInput"
        :value="valorExibido"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="desabilitado"
        :aria-invalid="!!errorMessage || undefined"
        :aria-describedby="errorMessage ? idErro : undefined"
        class="h-9.5 w-full rounded-padrao bg-cinza-claro px-2.5 text-12 placeholder:text-cinza-dtf disabled:cursor-not-allowed disabled:placeholder:text-cinza-escuro aria-invalid:ring-2 aria-invalid:ring-erro aria-invalid:ring-inset"
        :class="{ 'pl-11': icone, 'pr-8': ehSenha }"
        @input="aoDigitar"
        @blur="handleBlur($event, true)"
      />
      <button
        v-if="ehSenha"
        type="button"
        class="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded-padrao disabled:cursor-not-allowed"
        :aria-label="senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="senhaVisivel"
        :disabled="desabilitado"
        @click="senhaVisivel = !senhaVisivel"
      >
        <IconeOlhoFechado v-if="senhaVisivel" class="size-3" />
        <IconeOlho v-else class="size-3" />
      </button>
    </div>
    <p v-if="errorMessage" :id="idErro" class="text-12 text-erro">{{ errorMessage }}</p>
  </div>
</template>
