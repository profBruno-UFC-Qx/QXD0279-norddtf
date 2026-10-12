<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

import logoColorido from '@/assets/logo-colorido.webp'
import BaseTrilha from '@/components/base/BaseTrilha.vue'
import IconeSacola from '@/components/icones/IconeSacola.vue'
import IconeUsuario from '@/components/icones/IconeUsuario.vue'
import { useSessao } from '@/stores/sessao'
import type { Perfil } from '@/types/usuario'
import { itensDoTopoPorPerfil } from './itensMenuLoja'
import MenuLoja from './MenuLoja.vue'
import { useSair } from './useSair'

const acessoDoUsuario: Record<Perfil, { rotulo: string; para: RouteLocationRaw }> = {
  visitante: { rotulo: 'Entrar', para: { name: 'login' } },
  cliente: { rotulo: 'Meu perfil', para: { name: 'loja-perfil' } },
  admin: { rotulo: 'Painel', para: { name: 'admin-pedidos' } },
}

const sessao = useSessao()
const route = useRoute()
const { saindo, sair } = useSair()

const acesso = computed(() => acessoDoUsuario[sessao.perfil])
</script>

<template>
  <div
    class="mx-auto flex min-h-dvh w-full max-w-110 flex-col gap-7.5 px-5 py-7.5 md:max-w-none md:px-7.5 lg:max-w-320 lg:px-12.5"
  >
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2.5 lg:gap-12.5">
        <MenuLoja />
        <RouterLink :to="{ name: 'loja-produtos' }">
          <img :src="logoColorido" alt="NorDTF" class="w-29.25 lg:w-37.5" />
        </RouterLink>
        <nav aria-label="Menu da loja" class="hidden lg:block">
          <ul class="flex gap-2.5">
            <li v-for="item in itensDoTopoPorPerfil[sessao.perfil]" :key="item.rotulo">
              <RouterLink
                :to="item.para"
                class="flex h-10 items-center rounded-padrao px-3.75 text-16 font-bold"
                exact-active-class="bg-amarelo-dtf"
              >
                {{ item.rotulo }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
      <div class="flex items-center gap-2.5 lg:gap-5">
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
        <button
          v-if="sessao.perfil !== 'visitante'"
          type="button"
          class="hidden h-10 pl-2.5 font-destaque text-14 font-black disabled:cursor-not-allowed lg:block"
          :disabled="saindo"
          :aria-busy="saindo || undefined"
          @click="sair"
        >
          Sair
        </button>
      </div>
    </header>
    <BaseTrilha v-if="route.meta.trilha" :itens="route.meta.trilha" />
    <main>
      <RouterView />
    </main>
  </div>
</template>
