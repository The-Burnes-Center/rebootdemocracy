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
// Simple random ID like example - this is all we need for ISR to work
const id = useState("id", () => new Date().getMilliseconds())

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
    const response = await $fetch("/api/revalidate", {
      method: "POST",
      body: {
        tag: "test-isr",
        path: "/test-isr",
      },
    })

    revalidateStatus.value = "Cache purged! Reload the page to see a new random number."
    
    // Reload after a short delay to show the new content
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    revalidateError.value =
      error instanceof Error ? error.message : "Failed to revalidate"
    console.error("Revalidation error:", error)
  } finally {
    revalidating.value = false
  }
}
</script>
