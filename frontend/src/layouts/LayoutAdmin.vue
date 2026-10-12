<script setup lang="ts">
import type { Component } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import logoPreto from '@/assets/logo-preto.webp'
import IconeCabide from '@/components/icones/IconeCabide.vue'
import IconeConteudo from '@/components/icones/IconeConteudo.vue'
import IconeEstampa from '@/components/icones/IconeEstampa.vue'
import IconePedidos from '@/components/icones/IconePedidos.vue'
import IconeSair from '@/components/icones/IconeSair.vue'

const itens: { rotulo: string; para: RouteLocationRaw; icone: Component }[] = [
  { rotulo: 'Produtos', para: { name: 'admin-produtos' }, icone: IconeCabide },
  { rotulo: 'Estampas', para: { name: 'admin-estampas' }, icone: IconeEstampa },
  { rotulo: 'Pedidos', para: { name: 'admin-pedidos' }, icone: IconePedidos },
  { rotulo: 'Gestão de conteúdo', para: { name: 'admin-conteudo' }, icone: IconeConteudo },
]

const router = useRouter()
const route = useRoute()

// /admin/produtos/novo é rota irmã de /admin/produtos, e a classe ativa do RouterLink não a marca.
function estaAtivo(para: RouteLocationRaw) {
  const caminho = router.resolve(para).path
  return route.path === caminho || route.path.startsWith(`${caminho}/`)
}
</script>

<template>
  <div class="flex min-h-dvh">
    <aside
      class="sticky top-0 flex h-dvh w-70 shrink-0 flex-col justify-between px-5 py-12.5 ring-1 ring-cinza-escuro/67 ring-inset"
    >
      <div class="flex flex-col gap-25">
        <img :src="logoPreto" alt="NorDTF" class="w-37.5" />
        <nav aria-label="Menu do painel">
          <ul class="flex h-80 flex-col justify-between">
            <li v-for="item in itens" :key="item.rotulo">
              <RouterLink
                :to="item.para"
                class="flex h-12.5 items-center gap-5 rounded-padrao px-2.5 text-13 font-bold text-preto-dtf"
                :class="{ 'bg-amarelo-dtf': estaAtivo(item.para) }"
              >
                <component :is="item.icone" class="size-6 shrink-0" />
                {{ item.rotulo }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
      <button
        type="button"
        class="flex h-12.5 items-center gap-5 font-destaque text-14 font-black text-preto-dtf"
      >
        <IconeSair class="size-6" />
        Sair
      </button>
    </aside>
    <main class="min-w-0 flex-1 px-6.25 pt-12.5 pb-6.25">
      <RouterView />
    </main>
  </div>
</template>
