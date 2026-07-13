import './assets/main.css'

import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'
import { apiFetch, invalidateCsrfToken } from '@/api/client'
import { registerAccountIncompleteHandler } from '@/api/sessionInvalidation'
import App from './App.vue'
import { clearSession } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import router from './router'

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

registerAccountIncompleteHandler(async (message) => {
  clearSession()
  useFlashMessage().show(message, 'error')
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } catch {
    // Best effort — session may already be invalid.
  } finally {
    invalidateCsrfToken()
  }
  if (router.currentRoute.value.name !== 'login') {
    await router.replace({ name: 'login' })
  }
})

const app = createApp(App)

app.use(router)

app.mount('#app')
