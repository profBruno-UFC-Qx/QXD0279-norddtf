<script setup lang="ts">
import heroNordtf from '@/assets/hero-nordtf.png'

import LandingBotaoLink from './LandingBotaoLink.vue'
</script>

<template>
  <section
    class="relative isolate overflow-hidden bg-preto-dtf text-branco-dtf"
    aria-labelledby="titulo-principal"
  >
    <div
      class="absolute inset-0 -z-20 bg-cover bg-[position:72%_center] md:bg-[position:center]"
      :style="{ backgroundImage: `url(${heroNordtf})` }"
      aria-hidden="true"
    ></div>

    <div
      class="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.66)_32%,rgba(0,0,0,0.2)_66%,rgba(0,0,0,0.34)_100%)]"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.18)_38%,transparent_62%)]"
      aria-hidden="true"
    ></div>

    <span
      class="texto-contorno-claro pointer-events-none absolute bottom-[-0.08em] left-1/2 -z-10 -translate-x-1/2 select-none whitespace-nowrap font-destaque text-[clamp(6rem,22vw,18rem)] font-black uppercase leading-[0.7] tracking-[-0.06em]"
      aria-hidden="true"
    >
      NORDTF
    </span>

    <div
      class="relative z-10 mx-auto flex min-h-[82svh] w-full max-w-320 flex-col justify-between gap-14 px-5 pb-8 pt-14 md:px-7.5 md:pb-10 md:pt-20 lg:px-12.5"
    >
      <div class="flex flex-1 flex-col justify-center">
        <div
          class="revelar flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-branco-dtf/70"
          data-revelar
        >
          <span class="h-px w-10 bg-amarelo-dtf" aria-hidden="true"></span>
          Qualidade · Personalização · Cultura
        </div>

        <h1
          id="titulo-principal"
          class="revelar mt-6 max-w-4xl font-destaque text-[clamp(3.25rem,10vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.045em]"
          data-revelar
          :style="{ '--revelar-atraso': '90ms' }"
        >
          Sua arte.<br />
          Sua peça.<br />
          <span class="text-amarelo-dtf">Sua atitude.</span>
        </h1>

        <p
          class="revelar mt-7 max-w-md text-16 leading-relaxed text-branco-dtf/70 md:text-18"
          data-revelar
          :style="{ '--revelar-atraso': '180ms' }"
        >
          Arte própria e impressão DTF de alta definição, na peça ou em folha. Para quem não repete
          o visual de ninguém.
        </p>

        <div
          class="revelar mt-8 flex flex-wrap items-center gap-3"
          data-revelar
          :style="{ '--revelar-atraso': '270ms' }"
        >
          <LandingBotaoLink :para="{ name: 'loja-produtos' }" tamanho="grande">
            <span class="uppercase tracking-[0.1em]">Comprar agora</span>
            <span aria-hidden="true">→</span>
          </LandingBotaoLink>

          <LandingBotaoLink href="#como-funciona" variante="contornoClaro" tamanho="grande">
            <span class="uppercase tracking-[0.1em]">Como funciona</span>
          </LandingBotaoLink>
        </div>
      </div>

      <div
        class="revelar flex items-end justify-between gap-6 border-t border-branco-dtf/15 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-branco-dtf/55"
        data-revelar
        :style="{ '--revelar-atraso': '360ms' }"
      >
        <span>Nordeste · Brasil</span>
        <span class="hidden md:inline">Impressão DTF · Alta definição</span>
        <a
          href="#produtos"
          class="flex items-center gap-2 text-branco-dtf transition-colors hover:text-amarelo-dtf"
        >
          Explorar
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  </section>
</template>
