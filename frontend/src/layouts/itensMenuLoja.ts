import type { RouteLocationRaw } from 'vue-router'

import type { Perfil } from '@/types/usuario'

type ItemDoMenu = { rotulo: string; para: RouteLocationRaw }

const produtos: ItemDoMenu = { rotulo: 'Produtos', para: { name: 'loja-produtos' } }
const estampas: ItemDoMenu = { rotulo: 'Estampas', para: { name: 'loja-estampas' } }
const meusPedidos: ItemDoMenu = { rotulo: 'Meus pedidos', para: { name: 'loja-pedidos' } }

export const itensPorPerfil: Record<Perfil, ItemDoMenu[]> = {
  visitante: [produtos, estampas, { rotulo: 'Entrar', para: { name: 'login' } }],
  cliente: [
    produtos,
    estampas,
    meusPedidos,
    { rotulo: 'Meu perfil', para: { name: 'loja-perfil' } },
  ],
  admin: [produtos, estampas, { rotulo: 'Painel', para: { name: 'admin-pedidos' } }],
}

export const itensDoTopoPorPerfil: Record<Perfil, ItemDoMenu[]> = {
  visitante: [produtos, estampas],
  cliente: [produtos, estampas, meusPedidos],
  admin: [produtos, estampas],
}
