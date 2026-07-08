<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

const props = defineProps<{
  source: string
}>()

marked.setOptions({
  gfm: true,
  breaks: true,
})

const html = computed(() => {
  const raw = marked.parse(props.source, { async: false })
  return DOMPurify.sanitize(raw)
})
</script>

<template>
  <div class="markdown-content" v-html="html" />
</template>
