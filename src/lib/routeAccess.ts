import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { hasActiveCreateLogbookWizard } from '@/lib/createLogbookWizardStorage'
import type { UserMe } from '@/types'

/** Public routes that can paint before session check finishes (mobile landing / marketing). */
export function isPublicFastPath(meta: RouteLocationNormalized['meta']): boolean {
  return Boolean(meta.guestLanding || meta.publicPage || meta.guest)
}

export function authGuardRedirect(
  to: RouteLocationNormalized,
  user: UserMe | null,
): true | RouteLocationRaw {
  const isGuestRoute = Boolean(to.meta.guest)
  const isGuestLanding = Boolean(to.meta.guestLanding)
  const requiresAuth = Boolean(to.meta.requiresAuth)
  const requiresLogbook = Boolean(to.meta.requiresLogbook)

  if (isGuestLanding && user) {
    return user.has_logbook ? { name: 'dashboard' } : { name: 'connect' }
  }

  if (requiresAuth && !user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (isGuestRoute && user) {
    return user.has_logbook ? { name: 'dashboard' } : { name: 'connect' }
  }

  if (requiresLogbook && user && !user.has_logbook) {
    return { name: 'connect' }
  }

  if (to.name === 'connect' && user?.has_logbook) {
    return { name: 'dashboard' }
  }

  if (to.name === 'logbook-create' && user?.has_logbook) {
    if (hasActiveCreateLogbookWizard()) {
      return true
    }
    return { name: 'dashboard' }
  }

  return true
}
