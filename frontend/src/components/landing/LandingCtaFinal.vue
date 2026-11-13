<script setup lang="ts">
import LandingBotaoLink from './LandingBotaoLink.vue'
</script>

<template>
  <section
    class="relative isolate overflow-hidden bg-preto-dtf text-branco-dtf"
    aria-labelledby="titulo-cta"
  >
    <div class="grade-street absolute inset-0 -z-20 bg-preto-dtf" aria-hidden="true"></div>

    <div class="absolute inset-0 -z-10 bg-preto-dtf/70" aria-hidden="true"></div>
    <div
      class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,170,0,0.28),transparent_55%)]"
      aria-hidden="true"
    ></div>

    <span
      class="texto-contorno-claro pointer-events-none absolute bottom-[-0.08em] left-1/2 -z-10 -translate-x-1/2 select-none whitespace-nowrap font-destaque text-[clamp(5rem,20vw,16rem)] font-black uppercase leading-[0.7] tracking-[-0.06em]"
      aria-hidden="true"
    >
      NORDTF
    </span>

    <div
      class="revelar relative z-10 mx-auto flex w-full max-w-320 flex-col items-center px-5 py-20 text-center md:px-7.5 md:py-28 lg:px-12.5"
      data-revelar
    >
      <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-amarelo-dtf">
        Bora tirar do papel?
      </span>
      <h2
        id="titulo-cta"
        class="mt-4 max-w-3xl font-destaque text-[clamp(2.75rem,7vw,6rem)] font-black uppercase leading-[0.82] tracking-[-0.045em]"
      >
        Sua próxima peça começa aqui.
      </h2>
      <p class="mt-5 max-w-md text-16 leading-relaxed text-branco-dtf/70">
        Escolha uma peça, envie sua arte e deixe o resto com a gente.
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <LandingBotaoLink :para="{ name: 'loja-produtos' }" tamanho="grande">
          <span class="uppercase tracking-[0.1em]">Ver produtos</span>
          <span aria-hidden="true">→</span>
        </LandingBotaoLink>
        <LandingBotaoLink :para="{ name: 'cadastro' }" variante="contornoClaro" tamanho="grande">
          <span class="uppercase tracking-[0.1em]">Criar conta</span>
        </LandingBotaoLink>
      </div>
    </div>
  </section>
</template>
