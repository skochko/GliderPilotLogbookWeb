import './assets/main.css'

import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

const app = createApp(App)

app.use(router)

app.mount('#app')
