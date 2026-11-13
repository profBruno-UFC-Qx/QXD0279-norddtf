<script setup lang="ts">
import IconeCabide from '@/components/icones/IconeCabide.vue'
import IconeConteudo from '@/components/icones/IconeConteudo.vue'
import IconePedidos from '@/components/icones/IconePedidos.vue'

import LandingBotaoLink from './LandingBotaoLink.vue'

const passos = [
  {
    numero: '01',
    icone: IconeCabide,
    titulo: 'Escolha a peça',
    descricao: 'Navegue pelos produtos e selecione o modelo que combina com a sua ideia.',
  },
  {
    numero: '02',
    icone: IconeConteudo,
    titulo: 'Envie sua arte',
    descricao: 'Envie seu arquivo. Conferimos os detalhes antes de imprimir.',
  },
  {
    numero: '03',
    icone: IconePedidos,
    titulo: 'Receba em casa',
    descricao: 'Imprimimos em DTF e enviamos a peça pronta. Acompanhe tudo pela sua conta.',
  },
]
</script>

<template>
  <section
    id="como-funciona"
    class="scroll-mt-24 bg-preto-dtf py-16 text-branco-dtf md:py-20 lg:py-24"
    aria-labelledby="titulo-como-funciona"
  >
    <div class="mx-auto w-full max-w-320 px-5 md:px-7.5 lg:px-12.5">
      <div class="revelar max-w-3xl" data-revelar>
        <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-amarelo-dtf">
          O processo
        </span>
        <h2
          id="titulo-como-funciona"
          class="mt-3 font-destaque text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[0.85] tracking-[-0.04em]"
        >
          Simples. Direto.<br />
          Do seu jeito.
        </h2>
      </div>

      <ol class="mt-10 grid gap-8 md:grid-cols-3">
        <li
          v-for="(passo, indice) in passos"
          :key="passo.numero"
          class="revelar"
          data-revelar
          :style="{ '--revelar-atraso': `${indice * 100}ms` }"
        >
          <div class="relative aspect-square overflow-hidden bg-[#111111]">
            <div class="absolute inset-0 grid place-items-center" aria-hidden="true">
              <component :is="passo.icone" class="size-16 text-amarelo-dtf" />
              <span
                class="texto-contorno-claro absolute bottom-1 right-3 font-destaque text-[6rem] font-black leading-none"
              >
                {{ passo.numero }}
              </span>
            </div>
          </div>

          <div class="mt-5 flex items-baseline gap-3">
            <span class="text-[11px] font-black text-amarelo-dtf">{{ passo.numero }}</span>
            <h3 class="font-destaque text-24 font-black uppercase leading-none tracking-[-0.02em]">
              {{ passo.titulo }}
            </h3>
          </div>
          <p class="mt-3 text-14 leading-relaxed text-branco-dtf/65">{{ passo.descricao }}</p>
        </li>
      </ol>

      <div class="mt-10">
        <LandingBotaoLink :para="{ name: 'loja-produtos' }" tamanho="compacto">
          <span class="uppercase tracking-[0.1em]">Começar agora</span>
          <span aria-hidden="true">→</span>
        </LandingBotaoLink>
      </div>
    </div>
  </section>
</template>
