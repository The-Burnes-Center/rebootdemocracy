<template>
  <div>
    <p v-if="loading">Loading deferred data...</p>
    <p v-else>Deferred Data: {{ deferredData }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const deferredData = ref('')

// When the component is hydrated on the client, perform a new API call.
onMounted(async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/2')
  const json = await res.json()
  deferredData.value = json.title
  loading.value = false
})
</script>
