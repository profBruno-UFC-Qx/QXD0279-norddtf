<script setup lang="ts">
import { RouterLink, useRouter, type RouteLocationRaw } from 'vue-router'

import IconeVoltar from '@/components/icones/IconeVoltar.vue'

type ItemDaTrilha = { rotulo: string; para?: RouteLocationRaw }

const props = defineProps<{ itens: ItemDaTrilha[] }>()

const router = useRouter()

function voltar() {
  if (window.history.state?.back) {
    router.back()
    return
  }
  router.push(props.itens.at(-2)?.para ?? '/')
}
</script>

<template>
  <nav aria-label="Trilha" class="flex items-center gap-2.5">
    <button type="button" aria-label="Voltar" class="shrink-0" @click="voltar">
      <IconeVoltar class="size-6" />
    </button>
    <ol class="flex flex-wrap items-center text-14 font-medium text-preto-dtf">
      <li v-for="(item, indice) in itens" :key="indice">
        <span v-if="indice > 0" aria-hidden="true" class="whitespace-pre"> / </span>
        <span v-if="indice === itens.length - 1" aria-current="page" class="text-amarelo-dtf">
          {{ item.rotulo }}
        </span>
        <RouterLink v-else-if="item.para" :to="item.para">{{ item.rotulo }}</RouterLink>
        <span v-else>{{ item.rotulo }}</span>
      </li>
    </ol>
  </nav>
</template>
