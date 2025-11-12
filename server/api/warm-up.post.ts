/**
 * Post-Deployment Warm-Up Endpoint
 * 
 * This endpoint is triggered automatically after a successful Netlify deployment
 * (via Netlify Deploy Notifications). It makes requests to ISR pages to populate
 * the CDN cache immediately after deployment, ensuring fast response times for
 * the first visitors.
 * 
 * How it works:
 * 1. Triggered by Netlify Deploy Notification webhook after successful deploy
 * 2. Makes GET requests to configured ISR pages
 * 3. Each request triggers SSR and caches the response in durable cache
 * 4. Returns cache status for each page to verify warm-up succeeded
 * 
 * Setup:
 * 1. Go to Netlify Dashboard → Site Settings → Build & Deploy → Deploy Notifications
 * 2. Add notification: POST https://your-site.netlify.app/api/warm-up
 * 3. Event: "Deploy succeeded"
 * 
 * Configuration:
 * - Add ISR page paths to the pagesToWarmUp array below
 * - Each page will be requested and cached after deployment
 * 
 * Why warm up?
 * - Without warm-up: First visitor triggers SSR (slower, function invocation)
 * - With warm-up: First visitor gets cached response (faster, no function invocation)
 * 
 * References:
 * - Netlify Deploy Notifications: https://docs.netlify.com/site-deploys/notifications/
 * - See WARM_UP_SETUP.md for detailed setup instructions
 */
export default defineEventHandler(async (event) => {
  try {
    // Log that warm-up was triggered (useful for debugging)
    console.log("🔥 Warm-up endpoint called")
    console.log("Request headers:", Object.fromEntries(event.headers.entries()))
    
    // Get the site URL from request headers or environment variables
    // This ensures we're making requests to the correct deploy URL
    const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
    const protocol = event.headers.get("x-forwarded-proto") || "http"
    const siteUrl = `${protocol}://${host}`
    
    console.log(`Site URL: ${siteUrl}`)
    
    /**
     * Configure which pages to warm up after deployment
     * Add ISR page paths here - they will be requested and cached after each deploy
     */
    const pagesToWarmUp = [
      "/test-isr",
      // Add more ISR pages here as needed, e.g.:
      // "/blog",
      // "/products",
    ]
    
    console.log(`🔥 Starting warm-up for ${pagesToWarmUp.length} page(s) after deployment...`)
    
    const results = []
    
    // Import Netlify's getCacheStatus utility for accurate cache status reporting
    const { getCacheStatus } = await import("@netlify/cache")

    /**
     * Warm up each configured page
     * Each request will:
     * 1. Trigger SSR (if not already cached)
     * 2. Cache the response in durable cache
     * 3. Return cache status for verification
     */
    for (const path of pagesToWarmUp) {
      try {
        const url = `${siteUrl}${path}`
        console.log(`Warming up: ${url}`)
        
        // Make GET request to the ISR page
        // This triggers SSR and caches the response
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Netlify-Warm-Up/1.0", // Identify as warm-up request
            "X-Warm-Up": "true", // Custom header for identification
          },
        })
        
        const status = response.status
        const text = await response.text()
        const hasContent = text.length > 0
        
        /**
         * Check cache status to verify the page was cached
         * Cache status can be:
         * - "hit": Response was served from cache (unlikely on first warm-up)
         * - "miss": Response was generated fresh and cached
         * - "stale": Response was stale but served (with stale-while-revalidate)
         */
        const cacheInfo = getCacheStatus(response)
        const cacheStatus = cacheInfo.hit ? "hit" : (cacheInfo.caches?.edge?.stale ? "stale" : "miss")
        
        results.push({
          path,
          status,
          success: status === 200 && hasContent,
          contentLength: text.length,
          cacheStatus,
          cacheInfo: {
            hit: cacheInfo.hit,
            edgeHit: cacheInfo.caches?.edge?.hit || false,
            durableHit: cacheInfo.caches?.durable?.hit || false,
          },
        })
        
        console.log(`✅ ${path}: ${status} (${text.length} bytes, cache: ${cacheStatus}, edge: ${cacheInfo.caches?.edge?.hit ? 'hit' : 'miss'}, durable: ${cacheInfo.caches?.durable?.hit ? 'hit' : 'miss'})`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`❌ Failed to warm up ${path}:`, errorMsg)
        results.push({
          path,
          status: 0,
          success: false,
          error: errorMsg,
          cacheStatus: "error",
        })
      }
    }
    
    const successCount = results.filter((r) => r.success).length
    const totalCount = results.length
    
    console.log(`🔥 Warm-up complete: ${successCount}/${totalCount} pages warmed up successfully`)
    
    setResponseStatus(event, 200)
    return {
      message: "Warm-up completed",
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
      },
    }
  } catch (error) {
    console.error("Warm-up error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    throw createError({
      statusCode: 500,
      statusMessage: `Warm-up failed: ${errorMessage}`,
    })
  }
})

