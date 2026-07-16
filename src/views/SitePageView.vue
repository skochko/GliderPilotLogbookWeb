<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import PublicPageShell from '@/components/PublicPageShell.vue'
import { usePage } from '@/composables/usePage'
import { getSitePageByPath, getSitePageLabel } from '@/lib/sitePages'

const route = useRoute()
const router = useRouter()
const { page, loading, initialized, error, fetch, resetPageState } = usePage()

const pageType = computed(() => {
  const match = getSitePageByPath(route.path)
  return match?.type ?? null
})

const fallbackTitle = computed(() => {
  if (!pageType.value) return 'Page'
  return getSitePageLabel(pageType.value)
})

const updatedLabel = computed(() => {
  if (!page.value?.updated_at) return ''
  return new Date(page.value.updated_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

async function loadCurrentPage(): Promise<void> {
  if (!pageType.value) {
    await router.replace({ name: 'landing' })
    return
  }

  resetPageState()
  await fetch(pageType.value)
}

function updateDocumentTitle(): void {
  document.title = page.value?.title
    ? `${page.value.title} — Glider Pilot Logbook`
    : `${fallbackTitle.value} — Glider Pilot Logbook`
}

onMounted(() => {
  void loadCurrentPage()
})

watch(
  () => route.path,
  () => {
    void loadCurrentPage()
  },
)

watch(page, updateDocumentTitle, { immediate: true })
</script>

<template>
  <PublicPageShell>
    <LoadingState v-if="!initialized" />

    <ErrorBanner
      v-else-if="error"
      :message="error"
      :retry-busy="loading"
      @retry="loadCurrentPage"
    />

    <article
      v-else-if="page"
      class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <header class="border-b border-slate-200 pb-4">
        <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">{{ page.title }}</h1>
        <p v-if="updatedLabel" class="mt-2 text-sm text-slate-500">Last updated {{ updatedLabel }}</p>
      </header>

      <MarkdownContent class="mt-6" :source="page.content" />
    </article>
  </PublicPageShell>
</template>
