<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

import IconeMenu from '@/components/icones/IconeMenu.vue'
import { useSessao } from '@/stores/sessao'
import type { Perfil } from '@/types/usuario'

type ItemDoMenu = { rotulo: string; para: RouteLocationRaw }

const produtos: ItemDoMenu = { rotulo: 'Produtos', para: { name: 'loja-produtos' } }
const estampas: ItemDoMenu = { rotulo: 'Estampas', para: { name: 'loja-estampas' } }

const itensPorPerfil: Record<Perfil, ItemDoMenu[]> = {
  visitante: [produtos, estampas, { rotulo: 'Entrar', para: { name: 'login' } }],
  cliente: [
    produtos,
    estampas,
    { rotulo: 'Meus pedidos', para: { name: 'loja-pedidos' } },
    { rotulo: 'Meu perfil', para: { name: 'loja-perfil' } },
  ],
  admin: [produtos, estampas, { rotulo: 'Painel', para: { name: 'admin-pedidos' } }],
}

const sessao = useSessao()
const route = useRoute()
const aberto = ref(false)

watch(
  () => route.fullPath,
  () => {
    aberto.value = false
  },
)
</script>

<template>
  <DialogRoot v-model:open="aberto">
    <DialogTrigger aria-label="Abrir menu" class="shrink-0">
      <IconeMenu class="size-7.5" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-preto-dtf/50" />
      <DialogContent
        :aria-describedby="undefined"
        class="fixed inset-y-0 left-[max(0px,calc((100%-440px)/2))] z-50 flex w-75 max-w-[85%] flex-col gap-7.5 overflow-y-auto bg-branco-dtf px-5 py-7.5 text-preto-dtf outline-none"
      >
        <DialogTitle class="font-destaque text-24 font-extrabold">Menu</DialogTitle>
        <nav aria-label="Menu da loja">
          <ul class="flex flex-col gap-2.5">
            <li v-for="item in itensPorPerfil[sessao.perfil]" :key="item.rotulo">
              <RouterLink
                :to="item.para"
                class="flex h-12.5 items-center rounded-padrao px-2.5 text-16 font-bold"
                exact-active-class="bg-amarelo-dtf"
                @click="aberto = false"
              >
                {{ item.rotulo }}
              </RouterLink>
            </li>
            <li v-if="sessao.perfil !== 'visitante'">
              <button
                type="button"
                class="flex h-12.5 w-full items-center rounded-padrao px-2.5 font-destaque text-14 font-black"
              >
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
