<script setup lang="ts">
import { computed, useId } from 'vue'

import { URL_API } from '@/api/http'
import type { CampoDeImagem, CorDetalhada, TipoProduto } from '@/types/produto'

const props = defineProps<{ cores: CorDetalhada[]; tipo: TipoProduto }>()

const imagensPorTipo: Record<TipoProduto, { campo: CampoDeImagem; rotulo: string }[]> = {
  PERSONALIZAVEL: [
    { campo: 'imagemApresentacao', rotulo: 'Apresentação' },
    { campo: 'imagemPersonalizacaoFrente', rotulo: 'Personalização (frente)' },
    { campo: 'imagemPersonalizacaoCostas', rotulo: 'Personalização (costas)' },
  ],
  VENDA_DIRETA: [
    { campo: 'imagemApresentacao', rotulo: 'Apresentação' },
    { campo: 'imagemApresentacaoCostas', rotulo: 'Apresentação (costas)' },
  ],
}

const imagens = computed(() => imagensPorTipo[props.tipo])

const idTitulo = useId()
</script>

<template>
  <section
    :aria-labelledby="idTitulo"
    class="flex flex-col gap-2.5 rounded-padrao px-3.75 py-2.5 ring-1 ring-cinza-escuro/67 ring-inset"
  >
    <h2 :id="idTitulo" class="text-24 font-medium">Cores disponíveis</h2>
    <ul class="grid grid-cols-[repeat(auto-fill,293px)] items-start gap-5">
      <li
        v-for="cor in cores"
        :key="cor.id"
        class="flex w-73.25 flex-col gap-2.5 rounded-padrao p-2.5 ring-1 ring-cinza-claro ring-inset"
      >
        <div class="flex h-6 min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            class="size-6 shrink-0 rounded-full ring-1 ring-cinza-escuro/67 ring-inset"
            :style="{ backgroundColor: cor.hex }"
          />
          <h3 class="truncate text-16 font-medium">{{ cor.nome }}</h3>
        </div>
        <div class="flex justify-between gap-1.25">
          <figure
            v-for="imagem in imagens"
            :key="imagem.campo"
            class="flex w-21 flex-col items-center justify-between gap-1.25"
          >
            <figcaption class="min-h-7.5 text-center text-12 font-medium">
              {{ imagem.rotulo }}
            </figcaption>
            <div
              class="grid h-20.5 w-16.5 place-items-center rounded-padrao p-1 ring-1 ring-cinza-claro ring-inset"
            >
              <img
                v-if="cor[imagem.campo]"
                :src="URL_API + cor[imagem.campo]!.url"
                :alt="`${imagem.rotulo} da cor ${cor.nome}`"
                class="max-h-18.5 max-w-14.5 object-contain"
              />
            </div>
          </figure>
        </div>
      </li>
    </ul>
  </section>
</template>
