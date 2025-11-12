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

// Two-phase reload: After reloading with query param, reload again without it to cache base path
onMounted(() => {
  if (sessionStorage.getItem('isr_revalidate_phase2') === 'true') {
    sessionStorage.removeItem('isr_revalidate_phase2')
    // Wait longer for purge to propagate and ensure we have fresh content
    // Store the current number to verify it changed
    const currentNumber = id.value
    const storedNumber = sessionStorage.getItem('isr_revalidate_old_number')
    
    // If the number changed, we got fresh content - proceed to cache base path
    // If not, wait longer and retry
    if (storedNumber && currentNumber.toString() !== storedNumber) {
      // Number changed - we have fresh content, cache the base path
      setTimeout(() => {
        window.location.href = '/test-isr'
      }, 2000)
    } else {
      // Number didn't change - wait longer for purge to propagate
      console.log('Number unchanged, waiting longer for purge...')
      setTimeout(() => {
        window.location.href = '/test-isr'
      }, 10000) // Wait 10 seconds
    }
  }
})

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
    
    // Store the old number to verify it changed after reload
    sessionStorage.setItem('isr_revalidate_old_number', oldNumber.toString())
    
    // Two-phase reload strategy:
    // 1. First reload with query param to get fresh content (bypasses cache)
    // 2. Then reload without query param to cache the base path with fresh content
    setTimeout(() => {
      // Phase 1: Reload with cache-busting query param to get fresh content
      const timestamp = Date.now()
      revalidateStatus.value = `Reloading with fresh content...`
      window.location.href = `/test-isr?_revalidate=${timestamp}`
      
      // Phase 2: After page loads, reload again without query param to cache base path
      // Store a flag in sessionStorage to trigger the second reload
      sessionStorage.setItem('isr_revalidate_phase2', 'true')
    }, 8000) // Wait 8 seconds for purge to propagate
  } catch (error) {
    revalidateError.value =
      error instanceof Error ? error.message : "Failed to revalidate"
    console.error("Revalidation error:", error)
  } finally {
    revalidating.value = false
  }
}
</script>
