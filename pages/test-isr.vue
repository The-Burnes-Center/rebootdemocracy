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

    <div style="margin-top: 2rem; padding: 1.5rem; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
      <h2 style="margin-top: 0; color: #f57c00;">Directus Blog Post Content (Fetched During SSR)</h2>
      <p style="color: #555; margin-bottom: 1rem;">
        This content is fetched from Directus during server-side rendering.
        It only changes when the page is regenerated after cache purge.
      </p>
      
      <div v-if="blogPost" style="background: white; padding: 1.5rem; border-radius: 4px; max-height: 500px; overflow-y: auto;">
        <div v-html="blogPost" style="line-height: 1.6;"></div>
      </div>
      
      <div v-if="blogLoading" style="padding: 1rem; text-align: center; color: #666;">
        Loading blog post content...
      </div>
      
      <div v-if="blogError" style="padding: 1rem; background: #ffebee; border-radius: 4px; color: #c62828;">
        <strong>Error loading blog post:</strong> {{ blogError }}
      </div>
    </div>
    
    
    <div style="margin-top: 1rem; padding: 1rem; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
      <h3 style="margin-top: 0; color: #2e7d32;">How to Verify a New Page</h3>
      <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
        <li>Note the current random number: <strong>{{ id }}</strong></li>
        <li v-if="blogPost">Note the blog post content (first few words): <strong>{{ blogPost.substring(0, 50) }}...</strong></li>
        <li>Click "Revalidate Cache" button below</li>
        <li>Wait for the page to reload (15-20 seconds)</li>
        <li>Check if the number and blog content changed - if they did, a new page was generated! ✅</li>
      </ol>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #555;">
        <strong>Tip:</strong> The number only changes when the server regenerates the page after cache purge.
        If you see the same number, the cache hasn't been purged yet or the page reloaded from cache.
      </p>
    </div>

    
  </div>
</template>

<script setup lang="ts">
/**
 * ISR Test Page Component
 * 
 * This page demonstrates Incremental Static Regeneration (ISR) on Netlify.
 * It displays a random number that only changes when the page is regenerated
 * on the server after cache purge.
 * 
 * Key Features:
 * - Random number generated during SSR (only changes after cache purge)
 * - On-demand revalidation via /api/revalidate endpoint
 * - Cache status display for debugging
 * - Automatic reload after revalidation
 * 
 * How the random number works:
 * - Generated once during SSR when page is first rendered
 * - Stored in useState with a static key ("test-isr-id")
 * - Same number is used for all cached versions of the page
 * - Only changes when server regenerates the page (after cache purge)
 * 
 * Cache Tag:
 * - Set via server plugin (server/plugins/cache-tag.ts)
 * - Allows on-demand cache invalidation by tag
 * - Tag: "test-isr"
 */

/**
 * Random Number State
 * 
 * This generates a random number that persists until cache is revalidated.
 * The key "test-isr-id" is static, so the same value is used for the cached version.
 * 
 * Important: This only runs during SSR when the page is actually generated.
 * Each time the server renders this page (after cache purge), a new number is generated.
 */
const id = useState("test-isr-id", () => {
  const randomNum = Math.floor(Math.random() * 10000)
  console.log(`[SSR] Generated new random number: ${randomNum}`)
  return randomNum
})

/**
 * Page Generation Timestamp
 * 
 * Tracks when the page was generated (for display purposes).
 * This also only changes when the page is regenerated on the server.
 */
const generatedAt = useState("test-isr-generated-at", () => {
  const now = new Date()
  return now.toLocaleString('en-US', { 
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'medium'
  })
})

/**
 * Directus Blog Post Content
 * 
 * Fetches blog post content from Directus during SSR.
 * This data is embedded in the cached page and only changes
 * when the page is regenerated after cache purge.
 * 
 * Important: This fetch happens during SSR, so the data is part
 * of the cached HTML. When the page is regenerated, this API
 * is called again and fresh content is fetched.
 */
const { data: blogPost, pending: blogLoading, error: blogError } = await useFetch(
  'https://directus.theburnescenter.org/items/reboot_democracy_blog/28150',
  {
    key: 'test-isr-blog-post', // Static key ensures same data for cached version
    server: true, // Ensure it runs on server during SSR
    transform: (data: any) => {
      // Extract only the content field from the response
      return data?.data?.content || null
    },
  }
)

// Revalidation UI state
// const revalidating = ref(false)
// const revalidateStatus = ref("")
// const revalidateError = ref("")

/**
 * On-Demand Cache Revalidation
 * 
 * This function:
 * 1. Calls /api/revalidate endpoint to purge the cache
 * 2. Receives cache status information
 * 3. Adjusts wait time based on cache status
 * 4. Reloads the page after waiting for purge to propagate
 * 
 * The reload triggers ISR regeneration, which generates a new random number.
 */
// async function revalidate() {
//   revalidating.value = true
//   revalidateStatus.value = ""
//   revalidateError.value = ""

//   try {
//     // Store the old number to show what changed
//     const oldNumber = id.value
    
//     /**
//      * Step 1: Call revalidation endpoint
//      * 
//      * This purges the cache by tag and path, and returns cache status information.
//      * The endpoint:
//      * - Purges cache by tag ("test-isr")
//      * - Purges cache by path ("/test-isr") as backup
//      * - Checks cache status after purge
//      * - Returns cache status for debugging
//      */
//     const response = await $fetch("/api/revalidate", {
//       method: "POST",
//       body: {
//         tag: "test-isr", // Cache tag set by server plugin
//         path: "/test-isr", // Also purge the base path for reliability
//       },
//     })

//     const message = response.note || "Cache purged successfully"
//     const cacheStatus = response.cacheStatus
    
//     /**
//      * Step 2: Display cache status in UI
//      * 
//      * Show the user what happened and the cache status for debugging.
//      * This helps understand if purge worked and why regeneration might not happen.
//      */
//     let statusMessage = `Cache purged! Old number was ${oldNumber}. ${message}`
//     if (cacheStatus) {
//       statusMessage += `\nCache status: ${cacheStatus.overall} (edge: ${cacheStatus.edge}, durable: ${cacheStatus.durable})`
//     }
//     revalidateStatus.value = statusMessage
    
//     /**
//      * Step 3: Determine wait time based on cache status
//      * 
//      * If cache is still showing as "hit" after purge, it means:
//      * - Purge hasn't propagated yet (needs more time)
//      * - We should wait longer before reloading
//      * 
//      * Netlify says purge takes "a few seconds" but can take up to 60 seconds
//      * to propagate across all edge nodes.
//      */
//     const waitTime = cacheStatus?.overall === 'hit' ? 20000 : 15000
    
//     console.log(`⏳ Waiting ${waitTime/1000}s before reload (cache status: ${cacheStatus?.overall || 'unknown'})`)
    
//     /**
//      * Step 4: Reload page after waiting for purge to propagate
//      * 
//      * We do a two-step reload:
//      * 1. First, make a fetch request with cache-busting headers to ensure we hit the server
//      * 2. Then, reload the page normally
//      * 
//      * This ensures:
//      * - Browser cache is bypassed
//      * - We get fresh content from the server
//      * - ISR regenerates the page with a new random number
//      */
//     setTimeout(() => {
//       // Step 4a: Make a fetch request with cache-busting headers
//       // This ensures we hit the server, not browser cache
//       fetch('/test-isr', {
//         method: 'GET',
//         headers: {
//           'Cache-Control': 'no-cache', // Bypass browser cache
//           'Pragma': 'no-cache', // HTTP/1.0 cache control
//         },
//         cache: 'no-store' // Don't store in browser cache
//       }).then(() => {
//         // Step 4b: Reload the page
//         // This will trigger ISR regeneration if cache was purged
//         window.location.reload()
//       }).catch(() => {
//         // If fetch fails, still reload (non-critical)
//         window.location.reload()
//       })
//     }, waitTime)
//   } catch (error) {
//     revalidateError.value =
//       error instanceof Error ? error.message : "Failed to revalidate"
//     console.error("Revalidation error:", error)
//   } finally {
//     revalidating.value = false
//   }
// }
</script>
