<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  options: readonly string[]
  listId: string
}>()

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2'
</script>

<template>
  <input v-model="model" type="text" :list="listId" :class="inputClass" />
  <datalist :id="listId">
    <option v-for="option in options" :key="option" :value="option" />
  </datalist>
</template>
