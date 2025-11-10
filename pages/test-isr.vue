<template>
  <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
    <h1>ISR Test Page</h1>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <h2>Data from API:</h2>
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      <button @click="revalidate" style="margin-top: 1rem; padding: 0.5rem 1rem;">
        Revalidate Cache
      </button>
      <p v-if="revalidateStatus" style="margin-top: 1rem; color: green;">
        {{ revalidateStatus }}
      </p>
    </div>
  </div>
</template>

<script setup>
// Set cache tag header (as per Geist article)
const event = useRequestEvent()
if (import.meta.server && event) {
  setResponseHeader(event, 'netlify-cache-tag', 'test-isr')
}

// Fetch data
const { data, pending, error } = useFetch('/api/test-isr')

// Revalidation status
const revalidateStatus = ref('')

// On-demand revalidation
async function revalidate() {
  revalidateStatus.value = 'Purging cache...'
  try {
    const response = await $fetch('/.netlify/functions/revalidate?tag=test-isr', {
      method: 'GET'
    })
    revalidateStatus.value = 'Cache purged! Reload the page to see new data.'
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    revalidateStatus.value = 'Error: ' + (error instanceof Error ? error.message : 'Failed to revalidate')
    console.error('Revalidation error:', error)
  }
}

// SEO
useSeoMeta({
  title: 'ISR Test Page',
  description: 'Testing Incremental Static Regeneration with Nuxt 4'
})
</script>
