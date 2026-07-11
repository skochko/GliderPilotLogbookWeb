export type LandingScreenshotSlot = 'product' | 'dashboard' | 'mobile'

export interface LandingScreenshot {
  slot: LandingScreenshotSlot
  image_url: string
  alt_text: string
}

export interface LandingContent {
  screenshots: LandingScreenshot[]
}
