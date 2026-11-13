<script setup lang="ts">
import type { FlightMediaItem } from '@/types'

defineProps<{ video: FlightMediaItem }>()
</script>

<template>
  <figure class="space-y-1.5">
    <div class="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
      <iframe
        v-if="video.embed_url"
        class="absolute inset-0 h-full w-full"
        :src="video.embed_url"
        :title="video.label"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowfullscreen
      />
    </div>
    <figcaption class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
      <span class="min-w-0 truncate font-medium text-slate-900" :title="video.label">
        {{ video.label }}
      </span>
      <a
        v-if="video.url"
        :href="video.url"
        target="_blank"
        rel="noopener noreferrer"
        class="shrink-0 font-medium text-sky-700 hover:text-sky-900 hover:underline"
      >
        Open on YouTube <span aria-hidden="true">↗</span>
      </a>
    </figcaption>
  </figure>
</template>
