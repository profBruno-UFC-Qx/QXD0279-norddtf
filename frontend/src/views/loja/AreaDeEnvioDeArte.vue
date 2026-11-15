<script setup lang="ts">
import { ref, useId, useTemplateRef } from 'vue'

import IconeEnvio from '@/components/icones/IconeEnvio.vue'
import { useAcaoRestrita } from '@/composables/useAcaoRestrita'
import { enviarArte } from '@/utils/acoesDaLoja'
import { ARTE_INVALIDA, conferirArteDoCliente, EXTENSOES_DA_ARTE } from '@/utils/arteDoCliente'

const { exigirLogin } = useAcaoRestrita()
const idTitulo = useId()
const idErro = useId()
const seletor = useTemplateRef<HTMLInputElement>('seletor')
const invalida = ref(false)

function abrirSeletor() {
  if (!exigirLogin()) return
  seletor.value?.click()
}

function aoEscolher(evento: Event) {
  const campo = evento.target as HTMLInputElement
  const arquivo = campo.files?.[0]
  campo.value = ''
  if (!arquivo) return
  invalida.value = !conferirArteDoCliente(arquivo)
  if (!invalida.value) enviarArte(arquivo)
}
</script>

<template>
  <section :aria-labelledby="idTitulo" class="flex flex-col gap-5">
    <h2 :id="idTitulo" class="text-24 font-semibold">Importe sua estampa</h2>
    <div class="flex flex-col gap-2.5 rounded-padrao bg-cinza-claro p-2.5">
      <button
        type="button"
        class="flex w-full flex-col items-center justify-center gap-2.5 rounded-padrao bg-branco-dtf p-4 text-cinza-dtf"
        :class="{ 'ring-2 ring-erro ring-inset': invalida }"
        :aria-describedby="invalida ? idErro : undefined"
        @click="abrirSeletor"
      >
        <IconeEnvio class="size-6" />
        <span class="text-14 font-medium">Clique para importar</span>
        <span class="text-12">PNG, SVG, JPEG até 10 MB</span>
      </button>
      <p v-if="invalida" :id="idErro" role="alert" class="text-12 text-erro">{{ ARTE_INVALIDA }}</p>
    </div>
    <input
      ref="seletor"
      type="file"
      :accept="EXTENSOES_DA_ARTE"
      class="hidden"
      @change="aoEscolher"
    />
  </section>
</template>
