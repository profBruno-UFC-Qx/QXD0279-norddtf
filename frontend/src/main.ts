import '@fontsource-variable/afacad'
import 'rawline-webfont/800.css'
import 'rawline-webfont/900.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { configurarGanchosDeSessao } from './api/http'
import App from './App.vue'
import router from './router'
import { useSessao } from './stores/sessao'

const app = createApp(App)

app.use(createPinia())
app.use(router)

configurarGanchosDeSessao({
  aoNaoAutorizado() {
    const sessao = useSessao()
    if (!sessao.usuario) return

    const rotaAtual = router.currentRoute.value
    const acesso = rotaAtual.meta.acesso ?? 'publico'

    if (acesso !== 'cliente' && acesso !== 'admin') {
      sessao.limpar()
      return
    }

    sessao.expirar()
    router.push({ path: '/login', query: { voltar: rotaAtual.fullPath } })
  },
  aoAcessoNegado() {
    router.push(useSessao().destinoPadrao)
  },
})

await router.isReady()

app.mount('#app')
