import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { hasActiveCreateLogbookWizard } from '@/lib/createLogbookWizardStorage'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { SITE_PAGE_ROUTES } from '@/lib/sitePages'

const sitePageRoutes = SITE_PAGE_ROUTES.map((page) => ({
  path: page.path,
  name: `page-${page.type}`,
  component: () => import('@/views/SitePageView.vue'),
  meta: { publicPage: true },
}))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { guestLanding: true },
    },
    ...sitePageRoutes,
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/unsubscribe',
      name: 'unsubscribe',
      component: () => import('@/views/UnsubscribeView.vue'),
      meta: { publicPage: true },
    },
    {
      path: '/connect',
      name: 'connect',
      component: () => import('@/views/ConnectLogbookView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/logbook/create/manual-guide',
      name: 'logbook-create-manual-guide',
      component: () => import('@/views/CreateLogbookManualGuideView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/logbook/create',
      name: 'logbook-create',
      component: () => import('@/views/CreateLogbookView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
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
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/StatisticsView.vue'),
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
      path: '/automation',
      name: 'automation',
      component: () => import('@/views/AutomationView.vue'),
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
    const destination = user.value?.has_logbook ? { name: 'dashboard' as const } : { name: 'connect' as const }
    return { ...destination, replace: true }
  }
  if (authParam === 'error') {
    clear()
    show('Sign in failed. Please try again.', 'error')
    return { path: '/login', query: {}, replace: true }
  }

  const isGuestRoute = Boolean(to.meta.guest)
  const isGuestLanding = Boolean(to.meta.guestLanding)
  const requiresAuth = Boolean(to.meta.requiresAuth)
  const requiresLogbook = Boolean(to.meta.requiresLogbook)

  if (isGuestLanding && user.value) {
    return user.value.has_logbook ? { name: 'dashboard' } : { name: 'connect' }
  }

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

  if (to.name === 'logbook-create' && user.value?.has_logbook) {
    if (hasActiveCreateLogbookWizard()) {
      return true
    }
    return { name: 'dashboard' }
  }

  return true
})

export default router
