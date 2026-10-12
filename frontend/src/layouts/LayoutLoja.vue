<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

import logoColorido from '@/assets/logo-colorido.webp'
import BaseTrilha from '@/components/base/BaseTrilha.vue'
import IconeSacola from '@/components/icones/IconeSacola.vue'
import IconeUsuario from '@/components/icones/IconeUsuario.vue'
import { useSessao } from '@/stores/sessao'
import type { Perfil } from '@/types/usuario'
import MenuLoja from './MenuLoja.vue'

const acessoDoUsuario: Record<Perfil, { rotulo: string; para: RouteLocationRaw }> = {
  visitante: { rotulo: 'Entrar', para: { name: 'login' } },
  cliente: { rotulo: 'Meu perfil', para: { name: 'loja-perfil' } },
  admin: { rotulo: 'Painel', para: { name: 'admin-pedidos' } },
}

const sessao = useSessao()
const route = useRoute()

const acesso = computed(() => acessoDoUsuario[sessao.perfil])
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full max-w-110 flex-col gap-7.5 px-5 py-7.5">
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <MenuLoja />
        <RouterLink :to="{ name: 'loja-produtos' }">
          <img :src="logoColorido" alt="NorDTF" class="w-29.25" />
        </RouterLink>
      </div>
      <div class="flex items-center gap-2.5">
        <RouterLink
          v-if="sessao.perfil !== 'admin'"
          :to="{ name: 'loja-sacola' }"
          aria-label="Sacola"
        >
          <IconeSacola class="size-7.5" />
        </RouterLink>
        <RouterLink :to="acesso.para" :aria-label="acesso.rotulo">
          <IconeUsuario class="size-7.5" />
        </RouterLink>
      </div>
    </header>
    <BaseTrilha v-if="route.meta.trilha" :itens="route.meta.trilha" />
    <main>
      <RouterView />
    </main>
  </div>
</template>
