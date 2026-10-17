<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const abas: { rotulo: string; para: RouteLocationRaw }[] = [
  { rotulo: 'Categorias', para: { name: 'admin-conteudo-categorias' } },
  { rotulo: 'Materiais', para: { name: 'admin-conteudo-materiais' } },
]
</script>

<template>
  <div class="flex flex-col gap-6.25">
    <h1 class="text-32 font-bold">Gestão de conteúdo</h1>
    <nav
      aria-label="Abas da gestão de conteúdo"
      class="flex gap-2.5 shadow-[inset_0_-1px_0] shadow-cinza-escuro/67"
    >
      <RouterLink
        v-for="aba in abas"
        :key="aba.rotulo"
        :to="aba.para"
        class="px-5 py-2.5 text-16 font-bold text-cinza-dtf aria-[current=page]:text-preto-dtf aria-[current=page]:shadow-[inset_0_-3px_0] aria-[current=page]:shadow-amarelo-dtf"
      >
        {{ aba.rotulo }}
      </RouterLink>
    </nav>
    <RouterView />
  </div>
</template>
