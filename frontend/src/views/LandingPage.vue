<script setup lang="ts">
import LandingAviso from '@/components/landing/LandingAviso.vue'
import LandingBeneficios from '@/components/landing/LandingBeneficios.vue'
import LandingCaminhos from '@/components/landing/LandingCaminhos.vue'
import LandingComoFunciona from '@/components/landing/LandingComoFunciona.vue'
import LandingCtaFinal from '@/components/landing/LandingCtaFinal.vue'
import LandingDestaque from '@/components/landing/LandingDestaque.vue'
import LandingFaq from '@/components/landing/LandingFaq.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import LandingHeader from '@/components/landing/LandingHeader.vue'
import LandingHero from '@/components/landing/LandingHero.vue'
import LandingMarquee from '@/components/landing/LandingMarquee.vue'
import LandingSobre from '@/components/landing/LandingSobre.vue'
import { useRevelarAoRolar } from '@/composables/useRevelarAoRolar'

useRevelarAoRolar()
</script>

<template>
  <div id="topo" class="min-h-screen bg-branco-dtf text-preto-dtf">
    <LandingAviso />
    <LandingHeader />

    <main>
      <LandingHero />
      <LandingCaminhos />
      <LandingMarquee />
      <LandingSobre />
      <LandingBeneficios />
      <LandingComoFunciona />
      <LandingDestaque />
      <LandingFaq />
      <LandingCtaFinal />
    </main>

    <LandingFooter />
  </div>
</template>
