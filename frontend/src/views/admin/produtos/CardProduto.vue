<script setup lang="ts">
import { computed } from 'vue'

import { URL_API } from '@/api/http'
import BaseAlternador from '@/components/base/BaseAlternador.vue'
import BaseBotao from '@/components/base/BaseBotao.vue'
import type { ItemProduto } from '@/types/produto'
import { formatarMoeda } from '@/utils/formatacao'

const props = defineProps<{ produto: ItemProduto }>()

const emit = defineEmits<{ mudarSituacao: [ativo: boolean]; editar: [] }>()

const destino = computed(() => ({ name: 'admin-produto', params: { id: props.produto.id } }))

const ativo = computed({
  get: () => props.produto.ativo,
  set: (valor: boolean) => emit('mudarSituacao', valor),
})
</script>

<template>
  <article class="flex w-40 flex-col gap-2">
    <RouterLink
      :to="destino"
      :aria-label="`Visualizar ${produto.nome}`"
      class="block h-50 w-40 rounded-padrao"
      :class="{ 'bg-cinza-claro': !produto.imagem }"
    >
      <img
        v-if="produto.imagem"
        :src="URL_API + produto.imagem"
        alt=""
        class="size-full rounded-padrao object-cover"
      />
    </RouterLink>
    <BaseAlternador v-model="ativo" tamanho="compacto" :rotulo="`Situação de ${produto.nome}`" />
    <div class="flex flex-col">
      <RouterLink :to="destino" class="line-clamp-2 text-16 font-bold">
        {{ produto.nome }}
      </RouterLink>
      <p class="text-18 font-bold">{{ formatarMoeda(produto.preco) }}</p>
    </div>
    <BaseBotao
      variante="secundario"
      tamanho="compacto"
      class="w-full"
      :aria-label="`Editar ${produto.nome}`"
      @click="emit('editar')"
    >
      Editar
    </BaseBotao>
  </article>
</template>
