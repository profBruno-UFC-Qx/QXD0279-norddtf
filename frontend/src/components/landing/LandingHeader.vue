<script setup lang="ts">
import logoBranco from '@/assets/logo-branco.webp'

import LandingBotaoLink from './LandingBotaoLink.vue'
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-branco-dtf/10 bg-preto-dtf/95 text-branco-dtf backdrop-blur-md"
  >
    <div
      class="mx-auto flex h-16 w-full max-w-320 items-center justify-between gap-5 px-5 md:h-18 md:px-7.5 lg:px-12.5"
    >
      <RouterLink :to="{ name: 'landing' }" aria-label="NorDTF — página inicial" class="shrink-0">
        <img :src="logoBranco" alt="NorDTF Personalização" class="block w-24 sm:w-28 md:w-32" />
      </RouterLink>

      <nav aria-label="Navegação principal" class="hidden lg:block">
        <ul class="flex items-center gap-8">
          <li>
            <RouterLink
              :to="{ name: 'loja-produtos' }"
              class="text-[11px] font-bold uppercase tracking-[0.18em] text-branco-dtf/80 transition-colors hover:text-amarelo-dtf"
            >
              Produtos
            </RouterLink>
          </li>
          <li>
            <RouterLink
              :to="{ name: 'loja-materiais' }"
              class="text-[11px] font-bold uppercase tracking-[0.18em] text-branco-dtf/80 transition-colors hover:text-amarelo-dtf"
            >
              Materiais
            </RouterLink>
          </li>
          <li>
            <a
              href="#como-funciona"
              class="text-[11px] font-bold uppercase tracking-[0.18em] text-branco-dtf/80 transition-colors hover:text-amarelo-dtf"
            >
              Como funciona
            </a>
          </li>
          <li>
            <a
              href="#duvidas"
              class="text-[11px] font-bold uppercase tracking-[0.18em] text-branco-dtf/80 transition-colors hover:text-amarelo-dtf"
            >
              Dúvidas
            </a>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-3 md:gap-5">
        <RouterLink
          :to="{ name: 'login' }"
          class="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-branco-dtf/80 transition-colors hover:text-amarelo-dtf min-[420px]:inline"
        >
          Entrar
        </RouterLink>

        <LandingBotaoLink :para="{ name: 'loja-produtos' }" tamanho="compacto">
          <span class="uppercase tracking-[0.1em]">Ver produtos</span>
          <span aria-hidden="true">→</span>
        </LandingBotaoLink>
      </div>
    </div>
  </header>
</template>
