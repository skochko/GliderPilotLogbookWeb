<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import { getPage } from '@/api/pages'
import type { Page } from '@/types'

const page = ref<Page | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function loadPage(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    page.value = await getPage('logbook_create_manual_detail')
  } catch {
    error.value = 'Could not load the guide.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadPage()
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6 py-8">
    <div>
      <RouterLink
        to="/logbook/create"
        class="text-sm font-medium text-sky-700 hover:text-sky-800"
      >
        ← Back to create logbook
      </RouterLink>
    </div>

    <LoadingState v-if="loading" />
    <ErrorBanner v-else-if="error" :message="error" @retry="loadPage" />

    <article
      v-else-if="page"
      class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <header class="border-b border-slate-200 pb-4">
        <h1 class="text-2xl font-bold text-slate-900">{{ page.title }}</h1>
      </header>
      <MarkdownContent class="mt-6" :source="page.content" />
    </article>
  </div>
</template>

<style scoped>
:deep(.markdown-content a) {
  color: rgb(3 105 161);
  font-weight: 500;
  text-decoration: underline;
}
</style>
