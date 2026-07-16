<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    imageUrl?: string
    altText: string
    caption?: string
    id?: string
    variant?: 'browser' | 'phone'
    browserPath?: string
  }>(),
  {
    variant: 'browser',
    browserPath: 'gliderpilotlogbook.co.uk/dashboard',
  },
)

const BROWSER_IMAGE_WIDTH = 1600
const BROWSER_IMAGE_HEIGHT = 1000
const PHONE_IMAGE_WIDTH = 1080
const PHONE_IMAGE_HEIGHT = 1920

const imageReady = ref(false)

watch(
  () => props.imageUrl,
  () => {
    imageReady.value = false
  },
)

function onImageLoad(): void {
  imageReady.value = true
}
</script>

<template>
  <figure :id="id" class="landing-screenshot mx-auto max-w-5xl">
    <div class="mb-4 flex flex-wrap items-center justify-center gap-2">
      <span
        class="inline-flex items-center gap-1.5 rounded-full border border-landing-border bg-landing-card px-3 py-1 text-xs font-medium uppercase tracking-wide text-landing-secondary shadow-sm"
      >
        <svg class="h-3.5 w-3.5 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        App screenshot
      </span>
      <span class="text-xs text-landing-muted">Preview only — not interactive</span>
    </div>

    <!-- Browser mockup -->
    <div
      v-if="variant === 'browser'"
      class="pointer-events-none select-none overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/10"
    >
      <div class="flex items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3" aria-hidden="true">
        <div class="flex gap-1.5" aria-hidden="true">
          <span class="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span class="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span class="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div
          class="mx-auto flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400"
        >
          <svg class="h-3.5 w-3.5 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="truncate">{{ browserPath }}</span>
        </div>
      </div>

      <div class="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <div
          v-if="!imageUrl || !imageReady"
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 px-6 text-center"
          aria-hidden="true"
        >
          <p class="text-sm font-medium text-slate-500">
            {{ imageUrl ? 'Loading preview…' : 'Screenshot not uploaded yet' }}
          </p>
          <p v-if="!imageUrl" class="text-xs text-slate-400">This area shows a preview of the pilot app</p>
        </div>
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="altText"
          :width="BROWSER_IMAGE_WIDTH"
          :height="BROWSER_IMAGE_HEIGHT"
          class="absolute inset-0 h-full w-full object-contain object-top"
          :class="imageReady ? 'opacity-100' : 'opacity-0'"
          loading="lazy"
          decoding="async"
          @load="onImageLoad"
        />
      </div>
    </div>

    <!-- Phone mockup -->
    <div v-else class="pointer-events-none mx-auto max-w-[280px] select-none">
      <div
        class="overflow-hidden rounded-[2rem] border-[10px] border-slate-800 bg-slate-800 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/10"
      >
        <div class="flex justify-center bg-slate-900 py-2" aria-hidden="true">
          <span class="h-1.5 w-16 rounded-full bg-slate-700" />
        </div>

        <div class="relative aspect-[9/16] overflow-hidden bg-slate-100">
          <div
            v-if="!imageUrl || !imageReady"
            class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 px-4 text-center"
            aria-hidden="true"
          >
            <p class="text-sm font-medium text-slate-500">
              {{ imageUrl ? 'Loading preview…' : 'Screenshot not uploaded yet' }}
            </p>
            <p v-if="!imageUrl" class="text-xs text-slate-400">Mobile app preview</p>
          </div>
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="altText"
            :width="PHONE_IMAGE_WIDTH"
            :height="PHONE_IMAGE_HEIGHT"
            class="absolute inset-0 h-full w-full object-contain object-top"
            :class="imageReady ? 'opacity-100' : 'opacity-0'"
            loading="lazy"
            decoding="async"
            @load="onImageLoad"
          />
        </div>

        <div class="flex justify-center bg-slate-900 py-2" aria-hidden="true">
          <span class="h-1 w-24 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>

    <figcaption v-if="caption" class="mt-5 text-center text-sm leading-relaxed text-landing-secondary">
      {{ caption }}
    </figcaption>
  </figure>
</template>
