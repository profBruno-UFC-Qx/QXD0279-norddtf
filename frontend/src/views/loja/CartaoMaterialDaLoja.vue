<script setup lang="ts">
import { useId } from 'vue'

import ilustracaoCamiseta from '@/assets/ilustracao-camiseta.png'
import ilustracaoXicara from '@/assets/ilustracao-xicara.svg'
import BaseBotao from '@/components/base/BaseBotao.vue'
import type { Material, TipoMaterial } from '@/types/material'
import { formatarMoeda } from '@/utils/formatacao'
import { NOMES_DOS_MATERIAIS } from '@/utils/materiais'

const ilustracoes: Record<TipoMaterial, string> = {
  DTF: ilustracaoCamiseta,
  DTF_UV: ilustracaoXicara,
}

defineProps<{ material: Material }>()

const emit = defineEmits<{ montarFolha: [] }>()

const idNome = useId()
</script>

<template>
  <article
    :aria-labelledby="idNome"
    class="flex flex-col gap-3.75 rounded-padrao p-5 ring-1 ring-cinza-escuro/67 ring-inset"
  >
    <div class="flex items-center gap-3.75">
      <span class="grid size-12 shrink-0 place-items-center rounded-full bg-cinza-claro">
        <img :src="ilustracoes[material.tipo]" alt="" class="size-9 object-contain" />
      </span>
      <div class="flex min-w-0 flex-col items-start gap-1.25">
        <h2 :id="idNome" class="text-24 font-bold">{{ NOMES_DOS_MATERIAIS[material.tipo] }}</h2>
        <span class="rounded-padrao bg-cinza-escuro/25 px-3.25 py-1 text-12 font-medium">
          {{ material.etiqueta }}
        </span>
      </div>
    </div>
    <p class="flex-1 text-14 wrap-break-word">{{ material.descricao }}</p>
    <div class="flex flex-wrap items-end justify-between gap-3.75">
      <div class="flex flex-col gap-1.25">
        <p class="font-destaque text-24 font-extrabold">
          {{ formatarMoeda(material.precoPorM2) }}/m²
        </p>
        <p class="text-14 font-medium text-cinza-dtf">
          Largura da folha: {{ material.larguraFolhaCm }} cm
        </p>
      </div>
      <BaseBotao
        tamanho="compacto"
        class="w-35"
        :aria-label="`Montar folha ${NOMES_DOS_MATERIAIS[material.tipo]}`"
        @click="emit('montarFolha')"
      >
        Montar folha
      </BaseBotao>
    </div>
  </article>
</template>
