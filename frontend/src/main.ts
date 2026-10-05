import '@fontsource-variable/afacad'
import 'rawline-webfont/800.css'
import 'rawline-webfont/900.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
