<script setup lang="ts">
import LandingBotaoLink from './LandingBotaoLink.vue'
</script>

<template>
  <section class="overflow-hidden bg-amarelo-dtf text-preto-dtf" aria-label="Identidade NorDTF">
    <div class="mx-auto w-full max-w-320 px-5 py-16 md:px-7.5 md:py-20 lg:px-12.5 lg:py-24">
      <div class="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div class="revelar" data-revelar>
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-preto-dtf/70">
            Sem repetir o óbvio
          </span>
          <h2
            class="mt-4 font-destaque text-[clamp(2.75rem,7vw,6rem)] font-black uppercase leading-[0.82] tracking-[-0.045em]"
          >
            Não é só estampa.<br />
            <span class="texto-contorno-escuro">É identidade.</span>
          </h2>
        </div>

        <div class="revelar" data-revelar :style="{ '--revelar-atraso': '120ms' }">
          <p class="max-w-sm text-16 leading-relaxed text-preto-dtf/80">
            Cada peça carrega uma escolha. Estampa, arte, cor e atitude — do jeito que você quer ser
            visto.
          </p>
          <LandingBotaoLink
            :para="{ name: 'loja-produtos' }"
            variante="escuro"
            tamanho="grande"
            class="mt-6"
          >
            <span class="uppercase tracking-[0.1em]">Começar meu projeto</span>
            <span aria-hidden="true">→</span>
          </LandingBotaoLink>
        </div>
      </div>
    </div>
  </section>
</template>
