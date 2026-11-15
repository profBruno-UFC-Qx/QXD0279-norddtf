<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { listarMateriais } from '@/api/materiais'
import BaseEstadoCarga from '@/components/base/BaseEstadoCarga.vue'
import { useAcaoRestrita } from '@/composables/useAcaoRestrita'
import type { Material } from '@/types/material'
import { montarFolha } from '@/utils/acoesDaLoja'
import AreaDeEnvioDeArte from './AreaDeEnvioDeArte.vue'
import CartaoMaterialDaLoja from './CartaoMaterialDaLoja.vue'

const { exigirLogin } = useAcaoRestrita()

const materiais = ref<Material[]>([])
const estado = ref<'carregando' | 'erro' | 'pronta'>('carregando')
let controlador: AbortController | undefined

async function carregar() {
  controlador?.abort()
  controlador = new AbortController()
  const { signal } = controlador
  estado.value = 'carregando'
  try {
    materiais.value = await listarMateriais(signal)
    estado.value = 'pronta'
  } catch {
    if (!signal.aborted) estado.value = 'erro'
  }
}

onMounted(carregar)
onBeforeUnmount(() => controlador?.abort())

function aoMontarFolha(material: Material) {
  if (!exigirLogin()) return
  montarFolha(material)
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <div class="flex flex-col gap-1.25">
      <h1 class="text-24 font-bold lg:text-32">Materiais e folha DTF</h1>
      <p class="text-14 font-medium text-cinza-dtf">
        Escolha o material e monte sua folha com as suas estampas.
      </p>
    </div>
    <BaseEstadoCarga
      v-if="estado === 'carregando' || estado === 'erro'"
      :estado="estado"
      @tentar-novamente="carregar()"
    />
    <div v-else class="grid gap-5 md:grid-cols-2">
      <CartaoMaterialDaLoja
        v-for="material in materiais"
        :key="material.tipo"
        :material="material"
        @montar-folha="aoMontarFolha(material)"
      />
    </div>
    <AreaDeEnvioDeArte />
  </div>
</template>
