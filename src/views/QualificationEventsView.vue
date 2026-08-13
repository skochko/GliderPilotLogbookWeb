<script setup lang="ts">
import { computed, onMounted } from 'vue'
import LoadingState from '@/components/LoadingState.vue'
import { useLogbook } from '@/composables/useLogbook'
import LegacyQualificationDatesView from '@/features/qualificationEvents/legacy/LegacyQualificationDatesView.vue'
import V3QualificationEventsView from '@/features/qualificationEvents/v3/V3QualificationEventsView.vue'
import { resolveQualificationEventsTemplate } from '@/features/qualificationEvents/template'

const { templateEngine, initialized, fetchStatus } = useLogbook()
const template = computed(() => resolveQualificationEventsTemplate(templateEngine.value))
const view = computed(() =>
  template.value === 'v3' ? V3QualificationEventsView : LegacyQualificationDatesView,
)

onMounted(async () => {
  if (!initialized.value) await fetchStatus()
})
</script>

<template>
  <LoadingState v-if="!initialized" />
  <component :is="view" v-else />
</template>
