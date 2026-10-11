import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    acesso: 'publico' | 'visitante' | 'cliente' | 'admin'
    titulo: string
  }
}
