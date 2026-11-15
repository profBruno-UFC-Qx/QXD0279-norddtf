<script setup lang="ts">
import { computed } from 'vue'

import { URL_API } from '@/api/http'
import type { ItemDaLoja } from '@/types/produto'
import { formatarMoeda } from '@/utils/formatacao'

const props = defineProps<{ produto: ItemDaLoja }>()

const destino = computed(() => ({ name: 'loja-produto', params: { id: props.produto.id } }))
const categoria = computed(() => props.produto.categorias.map((item) => item.nome).join(' · '))
const coresDisponiveis = computed(() => props.produto.cores.filter((cor) => cor.estoque > 0))
const tamanhosExibidos = computed(() => props.produto.tamanhos.slice(0, 5))
const maisTamanhos = computed(() => Math.max(0, props.produto.tamanhos.length - 5))
</script>

<template>
  <RouterLink
    :to="destino"
    class="block h-full rounded-cartao focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-preto-dtf"
  >
    <article
      class="group flex h-full min-w-0 flex-col overflow-hidden rounded-cartao border border-preto-dtf/10 bg-branco-dtf transition-shadow hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]"
      :aria-label="`${produto.nome}, ${formatarMoeda(produto.preco)}`"
    >
      <div class="relative aspect-[4/5] overflow-hidden bg-cinza-claro">
        <img
          v-if="produto.imagem"
          :src="URL_API + produto.imagem"
          :alt="produto.nome"
          class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="grid size-full place-items-center bg-preto-dtf text-branco-dtf">
          <span
            class="texto-contorno-claro font-destaque text-[clamp(3rem,12vw,6rem)] font-black uppercase"
            aria-hidden="true"
          >
            NorDTF
          </span>
          <span class="sr-only">Imagem indisponível</span>
        </div>

        <span
          class="absolute left-3 top-3 bg-amarelo-dtf px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-preto-dtf"
        >
          {{ produto.tipo === 'PERSONALIZAVEL' ? 'Personalizável' : 'Pronta entrega' }}
        </span>
      </div>

      <div class="flex flex-1 flex-col p-3.5 sm:p-4">
        <span class="text-[10px] font-bold uppercase tracking-[0.16em] text-cinza-dtf">
          {{ categoria }}
        </span>
        <h2
          class="mt-1 line-clamp-2 min-h-10 font-destaque text-14 font-black uppercase leading-tight tracking-[-0.02em] sm:text-16"
        >
          {{ produto.nome }}
        </h2>

        <div class="mt-3 flex min-h-6 items-center justify-between gap-2">
          <div
            class="flex items-center pl-1"
            :aria-label="`${produto.totalDeCores} cores disponíveis`"
          >
            <span
              v-for="(cor, indice) in coresDisponiveis.slice(0, 4)"
              :key="cor.nome"
              class="-ml-1 inline-block size-5 rounded-full border-2 border-branco-dtf first:ml-0"
              :style="{ backgroundColor: cor.hex, zIndex: coresDisponiveis.length - indice }"
              :title="cor.nome"
              aria-hidden="true"
            ></span>
          </div>
          <span class="text-right text-12 font-semibold text-cinza-dtf">
            {{ produto.totalDeCores }}
            {{ produto.totalDeCores === 1 ? 'cor disponível' : 'cores disponíveis' }}
          </span>
        </div>

        <div v-if="produto.tamanhos.length" class="mt-3 flex flex-wrap gap-1">
          <span
            v-for="tamanho in tamanhosExibidos"
            :key="tamanho"
            class="grid h-6 min-w-6 place-items-center border border-preto-dtf/10 px-1 text-[10px] font-bold"
          >
            {{ tamanho }}
          </span>
          <span
            v-if="maisTamanhos"
            class="grid h-6 min-w-6 place-items-center px-1 text-[10px] font-bold text-cinza-dtf"
          >
            +{{ maisTamanhos }}
          </span>
        </div>
        <span v-else class="mt-3 h-6 text-12 text-cinza-dtf">Tamanho único</span>

        <p class="mt-4 border-t border-preto-dtf/10 pt-3 font-destaque text-18 font-black">
          {{ formatarMoeda(produto.preco) }}
        </p>
      </div>
    </article>
  </RouterLink>
</template>
