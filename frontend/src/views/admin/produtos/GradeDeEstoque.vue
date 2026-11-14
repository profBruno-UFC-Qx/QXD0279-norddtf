<script setup lang="ts">
import { useId } from 'vue'

import { TAMANHOS, type CorDetalhada, type Tamanho } from '@/types/produto'

defineProps<{ cores: CorDetalhada[]; temTamanho: boolean }>()

const idTitulo = useId()

function quantidade(cor: CorDetalhada, tamanho: Tamanho | null) {
  return cor.estoque.find((entrada) => entrada.tamanho === tamanho)?.quantidade ?? 0
}
</script>

<template>
  <section
    :aria-labelledby="idTitulo"
    class="flex flex-col gap-2.5 rounded-padrao px-3.75 py-7.5 ring-1 ring-cinza-escuro/67 ring-inset"
  >
    <h2 :id="idTitulo" class="text-24 font-medium">
      {{ temTamanho ? 'Tamanhos, cores e estoque' : 'Cores e estoque' }}
    </h2>
    <div
      v-for="cor in cores"
      :key="cor.id"
      class="overflow-hidden rounded-padrao border border-cinza-escuro/67"
    >
      <div
        class="flex items-center justify-between gap-2.5 bg-cinza-claro p-2.5"
        :class="{ 'border-b border-cinza-escuro/67': temTamanho }"
      >
        <span class="flex h-8.5 min-w-0 items-center gap-5 px-2.5 text-14 font-medium">
          <span
            aria-hidden="true"
            class="size-6 shrink-0 rounded-full ring-1 ring-cinza-escuro/67 ring-inset"
            :style="{ backgroundColor: cor.hex }"
          />
          <span class="truncate">{{ cor.nome }}</span>
        </span>
        <p v-if="!temTamanho" class="shrink-0 pr-2.5 text-14">
          Estoque <strong class="ml-2.5 font-bold">{{ quantidade(cor, null) }}</strong>
        </p>
      </div>
      <table v-if="temTamanho" class="w-full table-fixed border-collapse text-14">
        <caption class="sr-only">
          Estoque de
          {{
            cor.nome
          }}
          por tamanho
        </caption>
        <colgroup>
          <col class="w-21" />
          <col v-for="tamanho in TAMANHOS" :key="tamanho" />
        </colgroup>
        <thead>
          <tr class="h-7.25 border-b border-cinza-escuro/67 bg-cinza-claro">
            <th scope="col" class="pl-5 text-left font-normal">Tamanho</th>
            <th v-for="tamanho in TAMANHOS" :key="tamanho" scope="col" class="font-normal">
              {{ tamanho }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="h-9.25">
            <th scope="row" class="pl-5 text-left font-normal">Estoque</th>
            <td v-for="tamanho in TAMANHOS" :key="tamanho" class="text-center">
              {{ quantidade(cor, tamanho) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
