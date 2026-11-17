import { computed, readonly, ref } from 'vue'
import { fetchGoogleScopes, type GoogleScopeStatus } from '@/api/auth'

const scopes = ref<GoogleScopeStatus | null>(null)
let inflight: Promise<void> | null = null

/** True when Google refused to renew access (revoked/expired token or Drive access missing). */
const needsReconnect = computed(
  () => scopes.value !== null && (!scopes.value.available || !scopes.value.drive_file),
)

async function check(force = false): Promise<void> {
  if (inflight) return inflight
  if (scopes.value !== null && !force) return
  inflight = fetchGoogleScopes()
    .then((next) => {
      scopes.value = next
    })
    .catch(() => {
      // Network or server hiccup: do not nag the pilot with a reconnect banner.
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function resetGoogleAccessState(): void {
  scopes.value = null
}

export function useGoogleAccess() {
  return {
    scopes: readonly(scopes),
    needsReconnect,
    check,
  }
}
