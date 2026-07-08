import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/connect',
      name: 'connect',
      component: () => import('@/views/ConnectLogbookView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, requiresLogbook: true },
    },
    {
      path: '/flights',
      name: 'flights',
      component: () => import('@/views/FlightsView.vue'),
      meta: { requiresAuth: true, requiresLogbook: true },
    },
    {
      path: '/flights/new',
      name: 'flight-create',
      component: () => import('@/views/FlightCreateView.vue'),
      meta: { requiresAuth: true, requiresLogbook: true },
    },
    {
      path: '/flights/:id',
      name: 'flight-edit',
      component: () => import('@/views/FlightEditView.vue'),
      meta: { requiresAuth: true, requiresLogbook: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true, requiresLogbook: true },
    },
    {
      path: '/summary',
      name: 'summary',
      component: () => import('@/views/SummaryView.vue'),
      meta: { requiresAuth: true, requiresLogbook: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const { user, initialized, fetchMe } = useAuth()
  const { show, clear } = useFlashMessage()

  if (!initialized.value) {
    await fetchMe()
  }

  const authParam = to.query.auth
  if (authParam === 'success') {
    await fetchMe()
    show('Signed in successfully.', 'success')
    return { path: to.path, query: {}, replace: true }
  }
  if (authParam === 'error') {
    clear()
    show('Sign in failed. Please try again.', 'error')
    return { path: '/login', query: {}, replace: true }
  }

  const isGuestRoute = Boolean(to.meta.guest)
  const requiresAuth = Boolean(to.meta.requiresAuth)
  const requiresLogbook = Boolean(to.meta.requiresLogbook)

  if (requiresAuth && !user.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (isGuestRoute && user.value) {
    return user.value.has_logbook ? { name: 'dashboard' } : { name: 'connect' }
  }

  if (requiresLogbook && user.value && !user.value.has_logbook) {
    return { name: 'connect' }
  }

  if (to.name === 'connect' && user.value?.has_logbook) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
