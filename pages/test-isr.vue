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
      and the result will be cached and served for all subsequent requests. As
      the cache entry never becomes stale, the CDN will always serve it, unless
      invalidated (via cache purge API or a deploy).
    </p>
    <p>Below is a random number generated any time the page is rendered:</p>
    <p style="font-size: 2rem; font-weight: bold; text-align: center;">
      <code>{{ id }}</code>
    </p>
    <p style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
      Generated at: {{ generatedAt }}
    </p>
    
    
    <div style="margin-top: 1rem; padding: 1rem; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
      <h3 style="margin-top: 0; color: #2e7d32;">How to Verify a New Page</h3>
      <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
        <li>Note the current random number: <strong>{{ id }}</strong></li>
        <li>Click "Revalidate Cache" button below</li>
        <li>Wait 3 seconds for the page to reload</li>
        <li>Check if the number changed - if it did, a new page was generated! ✅</li>
      </ol>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #555;">
        <strong>Tip:</strong> The number only changes when the server regenerates the page after cache purge.
        If you see the same number, the cache hasn't been purged yet or the page reloaded from cache.
      </p>
    </div>

    <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
      <h2>Cache Revalidation</h2>
      <p style="margin-bottom: 1rem;">
        Click the button below to purge the cache and regenerate this page:
      </p>
      <button
        @click="revalidate"
        :disabled="revalidating"
        style="
          padding: 0.75rem 1.5rem;
          background: #00c7b7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        "
      >
        {{ revalidating ? "Revalidating..." : "Revalidate Cache" }}
      </button>
      <p
        v-if="revalidateStatus"
        style="margin-top: 1rem; color: #00c7b7; font-weight: 600;"
      >
        {{ revalidateStatus }}
      </p>
      <p
        v-if="revalidateError"
        style="margin-top: 1rem; color: #ff6b6b; font-weight: 600;"
      >
        Error: {{ revalidateError }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Cache tag is set via server plugin (server/plugins/cache-tag.ts)
// This allows on-demand cache invalidation by tag

// Generate a random ID that persists until cache is revalidated
// This will only change when the page is regenerated on the server (after cache purge)
// The key must be static so the same value is used for the cached version
const id = useState("test-isr-id", () => {
  // Generate a random number that will be the same for this cached version
  // This only runs during SSR when the page is actually generated
  // Each time the server renders this page (after cache purge), a new number is generated
  const randomNum = Math.floor(Math.random() * 10000)
  console.log(`[SSR] Generated new random number: ${randomNum}`)
  return randomNum
})

// No complex reload logic - just let ISR handle regeneration naturally

// Track when the page was generated (for display purposes)
const generatedAt = useState("test-isr-generated-at", () => {
  const now = new Date()
  return now.toLocaleString('en-US', { 
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'medium'
  })
})

// Revalidation state
const revalidating = ref(false)
const revalidateStatus = ref("")
const revalidateError = ref("")

// On-demand revalidation
async function revalidate() {
  revalidating.value = true
  revalidateStatus.value = ""
  revalidateError.value = ""

  try {
    const oldNumber = id.value
    const response = await $fetch("/api/revalidate", {
      method: "POST",
      body: {
        tag: "test-isr",
        path: "/test-isr", // Also purge the base path
      },
    })

    const message = response.note || "Cache purged successfully"
    revalidateStatus.value = `Cache purged! Old number was ${oldNumber}. ${message}`
    
    // Reload the same route - ISR will regenerate on next request
    // Wait longer for purge to propagate across all Netlify edge nodes
    // Netlify says purge takes "a few seconds" but can take up to 60 seconds
    setTimeout(() => {
      // Force reload without query params to keep the route the same
      // Add cache-busting headers via fetch first to ensure we hit the server
      fetch('/test-isr', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store'
      }).then(() => {
        // Then reload the page
        window.location.reload()
      }).catch(() => {
        // If fetch fails, still reload
        window.location.reload()
      })
    }, 15000) // Wait 15 seconds for purge to fully propagate
  } catch (error) {
    revalidateError.value =
      error instanceof Error ? error.message : "Failed to revalidate"
    console.error("Revalidation error:", error)
  } finally {
    revalidating.value = false
  }
}
</script>
