<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { CLUB_PAGES } from '@/lib/sitePages'

const props = withDefaults(
  defineProps<{
    variant?: 'footer' | 'header' | 'landing'
  }>(),
  {
    variant: 'footer',
  },
)

const route = useRoute()

function linkClass(path: string): string {
  const active = route.path === path
  if (props.variant === 'landing') {
    return active
      ? 'text-sm font-medium text-landing-primary'
      : 'text-sm font-medium text-landing-secondary transition hover:text-landing-primary'
  }
  if (props.variant === 'header') {
    return active
      ? 'text-sm font-medium text-sky-800 underline'
      : 'text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline'
  }
  return active
    ? 'text-landing-primary underline'
    : 'transition hover:text-landing-primary hover:underline'
}
</script>

<template>
  <div
    :class="
      props.variant === 'footer'
        ? 'flex flex-col items-center gap-2'
        : 'flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4'
    "
  >
    <span
      :class="
        props.variant === 'header'
          ? 'text-xs font-semibold uppercase tracking-wide text-slate-500'
          : 'text-xs font-semibold uppercase tracking-wide text-landing-muted'
      "
    >
      Club
    </span>
    <nav
      :class="
        props.variant === 'footer'
          ? 'flex flex-wrap items-center justify-center gap-x-4 gap-y-1'
          : 'flex flex-wrap items-center gap-x-4 gap-y-1'
      "
      aria-label="Club"
    >
      <RouterLink
        v-for="item in CLUB_PAGES"
        :key="item.path"
        :to="item.path"
        :class="linkClass(item.path)"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
