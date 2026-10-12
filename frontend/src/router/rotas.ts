import type { RouteRecordRaw } from 'vue-router'

const LayoutAutenticacao = () => import('@/layouts/LayoutAutenticacao.vue')
const PaginaProvisoria = () => import('@/views/PaginaProvisoria.vue')

const trilhaProdutos = { rotulo: 'Produtos', para: { name: 'loja-produtos' } }

export const rotas: RouteRecordRaw[] = [
  {
    path: '/login',
    component: LayoutAutenticacao,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/PaginaLogin.vue'),
        meta: { acesso: 'visitante', titulo: 'Entrar' },
      },
    ],
  },
  {
    path: '/cadastro',
    component: LayoutAutenticacao,
    children: [
      {
        path: '',
        name: 'cadastro',
        component: () => import('@/views/PaginaCadastro.vue'),
        meta: { acesso: 'visitante', titulo: 'Cadastre-se' },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/LayoutLoja.vue'),
    children: [
      {
        path: '',
        name: 'loja-produtos',
        component: PaginaProvisoria,
        meta: { acesso: 'publico', titulo: 'Produtos' },
      },
      {
        path: 'produtos/:id',
        name: 'loja-produto',
        component: PaginaProvisoria,
        meta: {
          acesso: 'publico',
          titulo: 'Produto',
          trilha: [trilhaProdutos, { rotulo: 'Produto' }],
        },
      },
      {
        path: 'estampas',
        name: 'loja-estampas',
        component: PaginaProvisoria,
        meta: { acesso: 'publico', titulo: 'Estampas', trilha: [{ rotulo: 'Estampas' }] },
      },
      {
        path: 'estampas/:id',
        name: 'loja-estampa',
        component: PaginaProvisoria,
        meta: {
          acesso: 'publico',
          titulo: 'Estampa',
          trilha: [{ rotulo: 'Estampas', para: { name: 'loja-estampas' } }, { rotulo: 'Estampa' }],
        },
      },
      {
        path: 'produtos/:id/personalizar',
        name: 'loja-personalizar',
        component: PaginaProvisoria,
        meta: {
          acesso: 'cliente',
          titulo: 'Personalizar',
          trilha: [trilhaProdutos, { rotulo: 'Personalizar' }],
        },
      },
      {
        path: 'folha',
        name: 'loja-folha',
        component: PaginaProvisoria,
        meta: {
          acesso: 'cliente',
          titulo: 'Montar folha',
          trilha: [trilhaProdutos, { rotulo: 'Montar folha' }],
        },
      },
      {
        path: 'sacola',
        name: 'loja-sacola',
        component: PaginaProvisoria,
        meta: {
          acesso: 'cliente',
          titulo: 'Sacola',
          trilha: [trilhaProdutos, { rotulo: 'Sacola' }],
        },
      },
      {
        path: 'checkout',
        name: 'loja-checkout',
        component: PaginaProvisoria,
        meta: {
          acesso: 'cliente',
          titulo: 'Finalizar pagamento',
          trilha: [trilhaProdutos, { rotulo: 'Finalizar pagamento' }],
        },
      },
      {
        path: 'pedidos',
        name: 'loja-pedidos',
        component: PaginaProvisoria,
        meta: {
          acesso: 'cliente',
          titulo: 'Meus pedidos',
          trilha: [trilhaProdutos, { rotulo: 'Meus pedidos' }],
        },
      },
      {
        path: 'pedidos/:numero',
        name: 'loja-pedido',
        component: PaginaProvisoria,
        meta: {
          acesso: 'cliente',
          titulo: 'Pedido',
          trilha: [trilhaProdutos, { rotulo: 'Pedido' }],
        },
      },
      {
        path: 'perfil',
        name: 'loja-perfil',
        component: PaginaProvisoria,
        meta: {
          acesso: 'cliente',
          titulo: 'Meu perfil',
          trilha: [trilhaProdutos, { rotulo: 'Meu perfil' }],
        },
      },
      {
        path: ':caminho(.*)*',
        name: 'nao-encontrada',
        component: () => import('@/views/PaginaNaoEncontrada.vue'),
        meta: { acesso: 'publico', titulo: 'Página não encontrada' },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/LayoutAdmin.vue'),
    redirect: { name: 'admin-pedidos' },
    children: [
      {
        path: 'pedidos',
        name: 'admin-pedidos',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Pedidos' },
      },
      {
        path: 'pedidos/:numero',
        name: 'admin-pedido',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Pedido' },
      },
      {
        path: 'produtos',
        name: 'admin-produtos',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Produtos' },
      },
      {
        path: 'produtos/novo',
        name: 'admin-produto-novo',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Cadastrar produto' },
      },
      {
        path: 'produtos/:id',
        name: 'admin-produto',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Produto' },
      },
      {
        path: 'produtos/:id/editar',
        name: 'admin-produto-editar',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Editar produto' },
      },
      {
        path: 'estampas',
        name: 'admin-estampas',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Estampas' },
      },
      {
        path: 'conteudo',
        name: 'admin-conteudo',
        component: PaginaProvisoria,
        meta: { acesso: 'admin', titulo: 'Gestão de conteúdo' },
      },
    ],
  },
]
