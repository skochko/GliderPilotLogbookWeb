import { onMounted, onUnmounted, ref } from 'vue'

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function usePwaInstall() {
  const canInstall = ref(false)
  const isInstalled = ref(false)
  const isIosDevice = ref(false)
  let deferredPrompt: BeforeInstallPromptEvent | null = null

  function onBeforeInstallPrompt(event: BeforeInstallPromptEvent): void {
    event.preventDefault()
    deferredPrompt = event
    canInstall.value = true
  }

  function onAppInstalled(): void {
    deferredPrompt = null
    canInstall.value = false
    isInstalled.value = true
  }

  onMounted(() => {
    isInstalled.value = isStandaloneDisplay()
    isIosDevice.value = isIos()
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  })

  async function install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferredPrompt) {
      return 'unavailable'
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    canInstall.value = false

    if (outcome === 'accepted') {
      isInstalled.value = true
    }

    return outcome
  }

  return {
    canInstall,
    isInstalled,
    isIosDevice,
    install,
  }
}
