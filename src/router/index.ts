import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { applyRouteSeo } from '@/lib/seoTags'
import { authGuardRedirect, isPublicFastPath } from '@/lib/routeAccess'
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
      path: '/help/club-automation-download',
      redirect: '/club/downloads',
    },
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

router.afterEach((to) => {
  applyRouteSeo(to)
})

router.beforeEach(async (to) => {
  const { user, initialized, fetchMe } = useAuth()
  const { show, clear } = useFlashMessage()
  const fast = isPublicFastPath(to.meta)

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

  if (!initialized.value) {
    if (fast) {
      void fetchMe().then(() => {
        const redirect = authGuardRedirect(router.currentRoute.value, user.value)
        if (redirect !== true) {
          void router.replace(redirect)
        }
      })
      return true
    }
    await fetchMe()
  }

  const redirect = authGuardRedirect(to, user.value)
  if (redirect !== true) {
    return redirect
  }
  return true
})

export default router
