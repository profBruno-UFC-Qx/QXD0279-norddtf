<script setup lang="ts">
const itens = [
  'Estampas prontas',
  'Arte própria',
  'Impressão DTF',
  'Personalização',
  'Envio para todo o Brasil',
  'Feito no Nordeste',
]
</script>

<template>
  <section
    class="overflow-hidden border-y border-preto-dtf bg-amarelo-dtf py-3"
    aria-label="Destaques da NorDTF"
  >
    <div class="marquee-faixa flex w-max">
      <div
        v-for="grupo in 2"
        :key="grupo"
        class="flex shrink-0 items-center"
        :aria-hidden="grupo === 2 ? 'true' : undefined"
      >
        <span
          v-for="item in itens"
          :key="`${grupo}-${item}`"
          class="flex items-center gap-6 pr-6 text-13 font-black uppercase tracking-[0.18em] text-preto-dtf md:text-14"
        >
          {{ item }}
          <span class="text-16" aria-hidden="true">✳</span>
        </span>
      </div>
    </div>
  </section>
</template>
