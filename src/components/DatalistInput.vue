<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  options: readonly string[]
  listId: string
}>()

const fieldClass = 'field-control'
</script>

<template>
  <input v-model="model" type="text" :list="listId" :class="fieldClass" />
  <datalist :id="listId">
    <option v-for="option in options" :key="option" :value="option" />
  </datalist>
</template>
