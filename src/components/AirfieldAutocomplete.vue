<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import DatalistInput from '@/components/DatalistInput.vue'
import { searchAirfields } from '@/api/airfields'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  listId: string
  localOptions?: readonly string[]
}>()

const remoteOptions = ref<string[]>([])
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let requestController: AbortController | undefined

const options = computed(() => {
  const seen = new Set<string>()
  return [...remoteOptions.value, ...(props.localOptions ?? [])].filter((option) => {
    const key = option.trim().toLocaleLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
})

watch(
  model,
  (value) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    requestController?.abort()

    const query = value.trim()
    if (query.length < 2) {
      remoteOptions.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      const controller = new AbortController()
      requestController = controller
      try {
        const results = await searchAirfields(query, controller.signal)
        if (!controller.signal.aborted) {
          remoteOptions.value = results.map((airfield) => airfield.name)
        }
      } catch {
        if (!controller.signal.aborted) remoteOptions.value = []
      }
    }, 300)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  requestController?.abort()
})
</script>

<template>
  <DatalistInput v-model="model" :list-id="listId" :options="options" />
</template>
