<template>
  <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
    <h1>ISR Test Page</h1>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <h2>Data from API:</h2>
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      <p style="margin-top: 1rem; color: #666;">
        Generated at: {{ data.timestamp }}
      </p>
      <button @click="revalidate" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer;">
        Revalidate Cache
      </button>
      <p v-if="revalidateStatus" style="margin-top: 1rem; color: green;">
        {{ revalidateStatus }}
      </p>
    </div>
  </div>
</template>

<script setup>
// Set cache tag header as per Netlify docs
const { ssrContext } = useNuxtApp()
if (ssrContext) {
  ssrContext.res.setHeader("Netlify-Cache-Tag", "test-isr")
}

// Fetch data
const { data, pending, error } = await useAsyncData("test-isr", async () => {
  return await $fetch("/api/test-isr")
})

// Revalidation status
const revalidateStatus = ref("")

// On-demand revalidation
async function revalidate() {
  revalidateStatus.value = "Purging cache..."
  try {
    await $fetch("/api/revalidate", {
      method: "POST",
      body: { tag: "test-isr", path: "/test-isr" },
    })
    revalidateStatus.value = "Cache purged! Regenerating page..."
    
    // Wait a bit for regeneration, then reload with cache-busting
    setTimeout(async () => {
      // Reload with cache-busting query param to ensure fresh data
      const timestamp = Date.now()
      window.location.href = `/test-isr?_revalidate=${timestamp}`
    }, 2000)
  } catch (error) {
    revalidateStatus.value =
      "Error: " + (error instanceof Error ? error.message : "Failed to revalidate")
    console.error("Revalidation error:", error)
  }
}

// SEO
useSeoMeta({
  title: "ISR Test Page",
  description: "Testing Incremental Static Regeneration with Nuxt 4",
})
</script>
