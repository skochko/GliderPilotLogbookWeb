<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import FlightListControls from '@/components/FlightListControls.vue'
import FormSheetLayout from '@/components/FormSheetLayout.vue'
import { emptyFlightListFilters, type FlightListSortPreset } from '@/lib/flightListQuery'
import type { FlightFilterOptions, FlightListFilters } from '@/types'

const props = defineProps<{
  open: boolean
  sortPreset: FlightListSortPreset
  filters: FlightListFilters
  filterOptions: FlightFilterOptions
  total: number
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  apply: [payload: { sortPreset: FlightListSortPreset; filters: FlightListFilters }]
}>()

const draftSortPreset = ref<FlightListSortPreset>('date_newest_first')
const draftFilters = ref<FlightListFilters>(emptyFlightListFilters())

const subtitle = computed(() => {
  if (props.total <= 0) {
    return undefined
  }
  return `${props.total} flight${props.total === 1 ? '' : 's'} matching`
})

function syncDraftFromProps(): void {
  draftSortPreset.value = props.sortPreset
  draftFilters.value = { ...props.filters }
}

function onClose(): void {
  if (props.loading) {
    return
  }
  emit('close')
}

function onApply(): void {
  emit('apply', {
    sortPreset: draftSortPreset.value,
    filters: { ...draftFilters.value },
  })
}

function onClearDraft(): void {
  draftFilters.value = emptyFlightListFilters()
  onApply()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    onClose()
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      syncDraftFromProps()
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      return
    }
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50">
      <div
        class="hidden sm:block fixed inset-0 bg-black/40"
        aria-hidden="true"
        @click="onClose"
      />

      <div
        class="fixed inset-0 flex flex-col bg-white sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:shadow-xl sm:overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-filters-title"
      >
        <FormSheetLayout
          title="Sort & filter"
          :subtitle="subtitle"
          title-id="flight-filters-title"
          :back-disabled="loading"
          show-desktop-close
          @back="onClose"
        >
          <FlightListControls
            :sort-preset="draftSortPreset"
            :filters="draftFilters"
            :filter-options="filterOptions"
            :loading="loading"
            @update:sort-preset="draftSortPreset = $event"
            @update:filters="draftFilters = $event"
          />

          <template #footer>
            <div class="flex w-full gap-3 sm:justify-end">
              <ActionButton
                variant="secondary"
                class="flex-1 sm:flex-none"
                :disabled="loading"
                @click="onClearDraft"
              >
                Clear
              </ActionButton>
              <ActionButton
                class="flex-1 sm:flex-none"
                :busy="loading"
                @click="onApply"
              >
                Apply
              </ActionButton>
            </div>
          </template>
        </FormSheetLayout>
      </div>
    </div>
  </Teleport>
</template>
