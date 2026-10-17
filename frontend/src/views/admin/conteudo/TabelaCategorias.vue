<script setup lang="ts">
import BaseBotao from '@/components/base/BaseBotao.vue'
import type { CategoriaComUso } from '@/types/categoria'

defineProps<{ categorias: CategoriaComUso[] }>()

const emit = defineEmits<{ renomear: [CategoriaComUso]; remover: [CategoriaComUso] }>()
</script>

<template>
  <table class="w-full table-fixed border-separate border-spacing-0 text-14 font-medium">
    <caption class="sr-only">
      Categorias
    </caption>
    <colgroup>
      <col />
      <col class="w-27.5" />
      <col class="w-27.5" />
      <col class="w-62.5" />
    </colgroup>
    <thead>
      <tr>
        <th
          scope="col"
          class="rounded-tl-padrao border bg-cinza-claro border-r-0 border-cinza-escuro/67 px-2.75 py-2.5 text-left font-medium"
        >
          Nome
        </th>
        <th
          scope="col"
          class="border-y bg-cinza-claro border-cinza-escuro/67 px-2.75 py-2.5 font-medium"
        >
          Produtos
        </th>
        <th
          scope="col"
          class="border-y bg-cinza-claro border-cinza-escuro/67 px-2.75 py-2.5 font-medium"
        >
          Estampas
        </th>
        <th
          scope="col"
          class="rounded-tr-padrao border bg-cinza-claro border-l-0 border-cinza-escuro/67 px-2.75 py-2.5 font-medium"
        >
          Ações
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="categoria in categorias" :key="categoria.id">
        <td class="border-b border-l border-cinza-escuro/67 p-2.75 wrap-anywhere">
          {{ categoria.nome }}
        </td>
        <td class="border-b border-cinza-escuro/67 p-2.75 text-center">{{ categoria.produtos }}</td>
        <td class="border-b border-cinza-escuro/67 p-2.75 text-center">{{ categoria.estampas }}</td>
        <td class="border-r border-b border-cinza-escuro/67 p-2.75">
          <div class="flex justify-center gap-2.5">
            <BaseBotao
              variante="secundario"
              tamanho="compacto"
              class="w-25"
              :aria-label="`Renomear ${categoria.nome}`"
              @click="emit('renomear', categoria)"
            >
              Renomear
            </BaseBotao>
            <BaseBotao
              variante="secundario"
              tamanho="compacto"
              class="w-25"
              :aria-label="`Remover ${categoria.nome}`"
              @click="emit('remover', categoria)"
            >
              Remover
            </BaseBotao>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
