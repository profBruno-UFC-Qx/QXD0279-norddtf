<script setup lang="ts">
import ilustracao from '@/assets/ilustracao-autenticacao.webp'
import logoBranco from '@/assets/logo-branco.webp'
</script>

<template>
  <div class="flex min-h-dvh flex-col md:flex-row md:gap-2.5 md:p-12.5">
    <div
      class="relative h-159.25 shrink-0 bg-amarelo-dtf md:order-2 md:h-auto md:w-[45.33%] md:rounded-painel"
    >
      <img
        :src="ilustracao"
        alt=""
        class="absolute top-63 left-1/2 w-77 -translate-x-1/2 md:top-[6.71%] md:left-[-18.81%] md:w-[105.35%] md:max-w-none md:translate-x-0"
      />
      <img
        :src="logoBranco"
        alt="NorDTF"
        class="absolute top-34.5 left-1/2 w-65.75 -translate-x-1/2 md:top-auto md:bottom-1.5 md:w-32.25"
      />
    </div>
    <main
      class="relative -mt-7.5 flex flex-1 flex-col items-center gap-3.75 rounded-t-[30px] bg-branco-dtf px-2.5 pt-13.5 pb-7.5 md:order-1 md:mt-0 md:justify-center md:rounded-none md:bg-transparent md:p-2.5"
    >
      <span
        aria-hidden="true"
        class="absolute top-9.5 left-1/2 h-0.75 w-25 -translate-x-1/2 bg-preto-dtf md:hidden"
      ></span>
      <RouterView />
    </main>
  </div>
</template>
