import { createRouter, createWebHistory } from 'vue-router'

import { guardaDeAcesso } from './guardas'
import { rotas } from './rotas'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rotas,
})

if (import.meta.env.DEV) {
  router.addRoute({
    path: '/_dev/componentes',
    name: 'dev-componentes',
    component: () => import('@/views/dev/VitrineComponentes.vue'),
    meta: { acesso: 'publico', titulo: 'Vitrine de componentes' },
  })
  router.addRoute({
    path: '/_dev/restrita',
    component: () => import('@/layouts/LayoutLoja.vue'),
    children: [
      {
        path: '',
        name: 'dev-restrita',
        component: () => import('@/views/dev/PaginaRestritaTeste.vue'),
        meta: { acesso: 'cliente', titulo: 'Página restrita' },
      },
    ],
  })
}

router.beforeEach(guardaDeAcesso)

export default router
