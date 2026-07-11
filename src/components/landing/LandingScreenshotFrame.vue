<script setup lang="ts">
defineProps<{
  imageUrl?: string
  altText: string
  caption?: string
  id?: string
  tall?: boolean
}>()
</script>

<template>
  <figure :id="id" class="landing-screenshot">
    <div
      class="overflow-hidden rounded-2xl border border-landing-border bg-landing-card shadow-[0_20px_50px_-24px_rgba(11,94,151,0.35)]"
      :class="tall ? 'aspect-[9/16] max-w-xs mx-auto' : 'aspect-[16/10]'"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="altText"
        class="h-full w-full object-cover object-top"
        loading="lazy"
        decoding="async"
      />
      <div
        v-else
        class="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#eef4fa] to-white px-6 text-center"
      >
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl border border-landing-border bg-white text-landing-muted"
          aria-hidden="true"
        >
          <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p class="text-sm text-landing-secondary">Screenshot preview</p>
      </div>
    </div>
    <figcaption v-if="caption" class="mt-4 text-center text-sm text-landing-secondary">
      {{ caption }}
    </figcaption>
  </figure>
</template>
