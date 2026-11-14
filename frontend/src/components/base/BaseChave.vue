<script setup lang="ts">
import { useId } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    rotulo: string
    desabilitado?: boolean
    mensagem?: string
  }>(),
  { desabilitado: false },
)

const ligada = defineModel<boolean>({ required: true })

const id = useId()
const idMensagem = `${id}-mensagem`

function alternar(valor: boolean) {
  if (props.desabilitado) return
  ligada.value = valor
}
</script>

<template>
  <div class="flex flex-col items-end gap-1.25">
    <div class="flex items-center gap-5.5">
      <label
        :for="id"
        class="text-12"
        :class="desabilitado ? 'cursor-not-allowed text-cinza-dtf' : 'text-preto-dtf'"
      >
        {{ rotulo }}
      </label>
      <SwitchRoot
        :id="id"
        :model-value="ligada"
        :aria-disabled="desabilitado || undefined"
        :aria-describedby="mensagem ? idMensagem : undefined"
        class="relative h-6.25 w-13.75 shrink-0 rounded-full bg-cinza-escuro/67 data-[state=checked]:bg-amarelo-dtf aria-disabled:cursor-not-allowed aria-disabled:bg-cinza-claro aria-disabled:ring-1 aria-disabled:ring-cinza-escuro/67 aria-disabled:ring-inset"
        @update:model-value="alternar"
      >
        <SwitchThumb
          class="absolute top-0.5 left-0.75 size-5.25 rounded-full bg-branco-dtf transition-transform data-[state=checked]:translate-x-7"
          :class="{ 'ring-1 ring-cinza-escuro/67 ring-inset': desabilitado }"
        />
      </SwitchRoot>
    </div>
    <p v-if="mensagem" :id="idMensagem" class="text-12 text-cinza-dtf">{{ mensagem }}</p>
  </div>
</template>
