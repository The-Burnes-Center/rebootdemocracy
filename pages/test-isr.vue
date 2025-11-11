<template>
  <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
    <h1>ISR Test Page</h1>
    <p>
      This page is <strong>not</strong> prerendered. It uses the default
      universal rendering mode. It is rendered on the fly by a serverless
      function (though this may be cached and served later), then hydrated on
      the client for subsequent interaction and navigation.
    </p>
    <p>
      It is configured to be cached on the Netlify CDN, with Incremental Static
      Regeneration (ISR) configured to never consider the cache stale. The first
      request after a deploy will invoke the SSR function to render on the fly
      and the result will be cached and served for all subsequent requests.
    </p>
    <p>Below is a random number generated any time the page is rendered:</p>
    <p style="font-size: 2rem; font-weight: bold;">{{ id }}</p>
    
    <div style="margin-top: 2rem;">
      <h2>Data from API:</h2>
      <div v-if="pending">Loading...</div>
      <div v-else-if="error">Error: {{ error }}</div>
      <div v-else>
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
        <p style="margin-top: 1rem; color: #666;">
          Generated at: {{ data.timestamp }}
        </p>
      </div>
    </div>

    <button @click="revalidate" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer;">
      Revalidate Cache
    </button>
    <p v-if="revalidateStatus" style="margin-top: 1rem; color: green;">
      {{ revalidateStatus }}
    </p>
  </div>
</template>

<script setup>
// Set cache tag header as per Netlify docs
const { ssrContext } = useNuxtApp()
if (ssrContext) {
  ssrContext.res.setHeader("Netlify-Cache-Tag", "test-isr")
}

// Simple random ID like example
const id = useState("id", () => new Date().getMilliseconds())

// Fetch data (non-blocking, client-side only to avoid SSR issues)
const { data, pending, error } = useFetch("/api/test-isr", {
  server: false, // Only fetch on client to avoid SSR issues
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
    revalidateStatus.value = "Cache purged! Reload the page to see new data."
    setTimeout(() => {
      window.location.reload()
    }, 1000)
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
