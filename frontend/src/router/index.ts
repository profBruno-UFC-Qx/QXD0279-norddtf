import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', component: () => import('@/views/InicioView.vue') }],
})

if (import.meta.env.DEV) {
  router.addRoute({
    path: '/_dev/componentes',
    component: () => import('@/views/dev/VitrineComponentes.vue'),
  })
}

export default router
