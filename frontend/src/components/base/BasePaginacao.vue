<script setup lang="ts">
import { computed } from 'vue'
import {
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from 'reka-ui'

import IconeSetaBaixo from '@/components/icones/IconeSetaBaixo.vue'

const props = defineProps<{ pagina: number; total: number; porPagina: number }>()

const emit = defineEmits<{ mudar: [pagina: number] }>()

const temMaisDeUmaPagina = computed(() => props.total > props.porPagina)

const botao =
  'grid size-9.25 place-items-center rounded-padrao text-13 font-bold text-preto-dtf disabled:cursor-not-allowed disabled:bg-cinza-escuro/67 disabled:ring-0'
const secundario = 'bg-branco-dtf ring-1 ring-cinza-escuro/67 ring-inset'
</script>

<template>
  <PaginationRoot
    v-if="temMaisDeUmaPagina"
    :page="pagina"
    :total="total"
    :items-per-page="porPagina"
    aria-label="Paginação"
    @update:page="emit('mudar', $event)"
  >
    <PaginationList v-slot="{ items }" class="flex justify-center gap-2.5">
      <PaginationPrev aria-label="Página anterior" :class="[botao, secundario]">
        <IconeSetaBaixo class="size-4 rotate-90" />
      </PaginationPrev>
      <template v-for="(item, indice) in items" :key="indice">
        <PaginationListItem
          v-if="item.type === 'page'"
          :value="item.value"
          :aria-label="`Página ${item.value}`"
          :class="[botao, item.value === pagina ? 'bg-amarelo-dtf' : secundario]"
        >
          {{ item.value }}
        </PaginationListItem>
        <PaginationEllipsis v-else class="grid size-9.25 place-items-center text-13 font-bold">
          …
        </PaginationEllipsis>
      </template>
      <PaginationNext aria-label="Próxima página" :class="[botao, secundario]">
        <IconeSetaBaixo class="size-4 -rotate-90" />
      </PaginationNext>
    </PaginationList>
  </PaginationRoot>
</template>
