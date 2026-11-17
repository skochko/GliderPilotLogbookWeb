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

/**
 * Where the /demo share link should take the visitor.
 * Guests start the demo logbook. Signed-in pilots keep their own session, unless the link
 * asks to switch (`signOut` given, e.g. /demo?logout=1 from an email): then they are signed
 * out first and the demo opens.
 */
export async function demoLinkRedirect(
  user: UserMe | null,
  startDemo: () => Promise<UserMe | null>,
  onUnavailable: () => void,
  signOut?: () => Promise<boolean>,
): Promise<RouteLocationRaw> {
  if (user?.is_demo) {
    return { name: 'dashboard' }
  }
  if (user) {
    const ownLogbook: RouteLocationRaw = user.has_logbook
      ? { name: 'dashboard' }
      : { name: 'connect' }
    if (!signOut || !(await signOut())) {
      return ownLogbook
    }
  }
  const demoUser = await startDemo()
  if (!demoUser) {
    onUnavailable()
    return { name: 'landing' }
  }
  return { name: 'dashboard' }
}
