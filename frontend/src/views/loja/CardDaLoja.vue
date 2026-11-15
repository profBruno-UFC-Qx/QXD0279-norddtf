<script setup lang="ts">
import { computed } from 'vue'

import { URL_API } from '@/api/http'
import type { ItemDaLoja } from '@/types/produto'
import { formatarMoeda } from '@/utils/formatacao'

const props = defineProps<{ produto: ItemDaLoja }>()

const destino = computed(() => ({ name: 'loja-produto', params: { id: props.produto.id } }))

const textoDasCores = computed(() => {
  const total = props.produto.totalDeCores
  return total === 1 ? '1 cor disponível' : `${total} cores disponíveis`
})
</script>

<template>
  <RouterLink
    :to="destino"
    class="flex h-full flex-col gap-2.5 overflow-hidden rounded-cartao ring-1 ring-cinza-claro ring-inset"
  >
    <img
      :src="URL_API + produto.imagem"
      :alt="produto.nome"
      loading="lazy"
      decoding="async"
      class="aspect-193/257 w-full object-cover"
    />
    <div class="flex flex-col gap-5 px-2.5 py-3.25">
      <p class="text-18 leading-5 font-bold">{{ produto.nome }}</p>
      <div class="flex items-center gap-5">
        <div class="flex shrink-0 -space-x-3.5">
          <span
            v-for="cor in produto.cores"
            :key="cor.hex + cor.nome"
            role="img"
            :aria-label="cor.nome"
            class="size-6 rounded-full ring-1 ring-cinza-escuro/67 ring-inset"
            :style="{ backgroundColor: cor.hex }"
          />
        </div>
        <p class="text-14 font-bold">{{ textoDasCores }}</p>
      </div>
      <p class="text-24 font-bold">{{ formatarMoeda(produto.preco) }}</p>
    </div>
  </RouterLink>
</template>
