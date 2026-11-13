import type { RouteLocationRaw } from 'vue-router'

import type { Perfil } from '@/types/usuario'

type ItemDoMenu = { rotulo: string; para: RouteLocationRaw }

const produtos: ItemDoMenu = { rotulo: 'Produtos', para: { name: 'loja-produtos' } }
const materiais: ItemDoMenu = { rotulo: 'Materiais', para: { name: 'loja-materiais' } }
const meusPedidos: ItemDoMenu = { rotulo: 'Meus pedidos', para: { name: 'loja-pedidos' } }

export const itensPorPerfil: Record<Perfil, ItemDoMenu[]> = {
  visitante: [produtos, materiais, { rotulo: 'Entrar', para: { name: 'login' } }],
  cliente: [
    produtos,
    materiais,
    meusPedidos,
    { rotulo: 'Meu perfil', para: { name: 'loja-perfil' } },
  ],
  admin: [produtos, materiais, { rotulo: 'Painel', para: { name: 'admin-pedidos' } }],
}

export const itensDoTopoPorPerfil: Record<Perfil, ItemDoMenu[]> = {
  visitante: [produtos, materiais],
  cliente: [produtos, materiais, meusPedidos],
  admin: [produtos, materiais],
}
