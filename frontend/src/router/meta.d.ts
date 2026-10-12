import 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    acesso: 'publico' | 'visitante' | 'cliente' | 'admin'
    titulo: string
    trilha?: { rotulo: string; para?: RouteLocationRaw }[]
  }
}
