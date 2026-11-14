<script setup lang="ts">
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'

import IconeFechar from '@/components/icones/IconeFechar.vue'
import IconeMarcado from '@/components/icones/IconeMarcado.vue'
import IconeSetaBaixo from '@/components/icones/IconeSetaBaixo.vue'

type Opcao = { valor: string; rotulo: string }

const props = withDefaults(
  defineProps<{
    nome: string
    rotulo: string
    opcoes: Opcao[]
    placeholder?: string
  }>(),
  { placeholder: 'Selecione as categorias' },
)

const id = useId()
const idErro = `${id}-erro`

const { value, errorMessage, handleBlur, handleChange } = useField<string[]>(
  () => props.nome,
  undefined,
  { validateOnValueUpdate: false },
)

const escolhidos = computed({
  get: () => value.value ?? [],
  set: (valores: string[]) => handleChange(valores, !!errorMessage.value),
})

const rotuloPorValor = computed(
  () => new Map(props.opcoes.map((opcao) => [opcao.valor, opcao.rotulo])),
)

const fichas = computed(() =>
  escolhidos.value.flatMap((valor) => {
    const rotulo = rotuloPorValor.value.get(valor)
    return rotulo ? [{ valor, rotulo }] : []
  }),
)

function tirar(valor: string) {
  escolhidos.value = escolhidos.value.filter((escolhido) => escolhido !== valor)
}
</script>

<template>
  <div class="flex flex-col gap-1.25">
    <label :for="id" class="text-14 font-medium">{{ rotulo }}</label>
    <ComboboxRoot v-model="escolhidos" multiple class="relative">
      <ComboboxAnchor
        class="flex min-h-9.5 w-full items-center gap-2.5 rounded-padrao bg-cinza-claro px-2.5 py-1.25"
        :class="{ 'ring-2 ring-erro ring-inset': errorMessage }"
      >
        <ul class="flex min-w-0 flex-1 flex-wrap gap-1.25">
          <li
            v-for="ficha in fichas"
            :key="ficha.valor"
            class="inline-flex h-6 items-center gap-1.25 rounded-padrao bg-branco-dtf pr-1.5 pl-2 text-12 font-medium whitespace-nowrap ring-1 ring-cinza-escuro/67 ring-inset"
          >
            {{ ficha.rotulo }}
            <button
              type="button"
              class="grid size-4 place-items-center rounded-padrao"
              :aria-label="`Tirar ${ficha.rotulo}`"
              @click="tirar(ficha.valor)"
            >
              <IconeFechar class="size-3" />
            </button>
          </li>
          <li class="flex min-w-15 flex-1">
            <ComboboxInput
              :id="id"
              :placeholder="escolhidos.length ? undefined : placeholder"
              :aria-invalid="!!errorMessage || undefined"
              :aria-describedby="errorMessage ? idErro : undefined"
              class="h-6 w-full bg-transparent text-12 placeholder:text-cinza-dtf"
              @blur="handleBlur($event, true)"
            />
          </li>
        </ul>
        <ComboboxTrigger aria-label="Mostrar opções" class="shrink-0">
          <IconeSetaBaixo class="size-3" />
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxContent
        class="absolute top-full right-0 left-0 z-10 mt-1.25 rounded-padrao bg-branco-dtf p-1.25 ring-1 ring-cinza-escuro/67 ring-inset"
      >
        <ComboboxViewport class="max-h-47.5 overflow-y-auto">
          <ComboboxItem
            v-for="opcao in opcoes"
            :key="opcao.valor"
            :value="opcao.valor"
            class="group flex h-8 cursor-pointer items-center gap-2.5 rounded-padrao px-2.5 text-14 data-highlighted:bg-cinza-claro"
          >
            <span
              class="grid size-4 shrink-0 place-items-center rounded-[3px] ring-1 ring-cinza-dtf ring-inset group-data-[state=checked]:bg-amarelo-dtf group-data-[state=checked]:ring-0"
            >
              <IconeMarcado class="hidden size-3 group-data-[state=checked]:block" />
            </span>
            {{ opcao.rotulo }}
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxRoot>
    <p v-if="errorMessage" :id="idErro" class="text-12 text-erro">{{ errorMessage }}</p>
  </div>
</template>
