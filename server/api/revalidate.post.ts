/**
 * On-Demand Cache Revalidation Endpoint
 * 
 * This endpoint allows you to invalidate cached ISR pages on-demand, triggering
 * regeneration on the next request. This is useful when content changes in your
 * CMS and you want to update the cached pages immediately.
 * 
 * How it works:
 * 1. Receives a cache tag (and optionally a path) to purge
 * 2. Purges cache by tag using Netlify's purgeCache API
 * 3. Also purges by path as a backup for reliability
 * 4. Verifies purge worked by checking cache status
 * 5. Returns cache status for debugging
 * 
 * Usage:
 * POST /api/revalidate
 * Body: { tag: "test-isr", path: "/test-isr" }
 * 
 * Rate Limits:
 * - 2 purges per tag/site per 5 seconds
 * - Automatic retry with 6-second wait if rate limited
 * 
 * Environment Variables:
 * - NETLIFY_AUTH_TOKEN: Required for actual cache purging
 *   Get from: Netlify Dashboard → Site Settings → Build & Deploy → Environment Variables
 * 
 * References:
 * - Netlify Cache Invalidation: https://docs.netlify.com/build/caching/caching-overview/#on-demand-invalidation
 * - purgeCache API: https://docs.netlify.com/api/get-started/#purge-cache
 */
import { purgeCache } from "@netlify/functions"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body?.tag) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing tag parameter",
      })
    }

    // Check if NETLIFY_AUTH_TOKEN is available
    const authToken = process.env.NETLIFY_AUTH_TOKEN
    if (!authToken) {
      console.warn("NETLIFY_AUTH_TOKEN not set - cache purge will be simulated")
      setResponseStatus(event, 202)
      return {
        message: "Cache purge simulated (NETLIFY_AUTH_TOKEN not configured)",
        tag: body.tag,
        note: "Set NETLIFY_AUTH_TOKEN in Netlify environment variables for actual cache purging",
      }
    }

    /**
     * Step 1: Purge Cache by Tag and Path
     * 
     * IMPORTANT: Cache purge is by TAG only, NOT the complete Netlify cache.
     * 
     * How it works:
     * - Tag purge: Invalidates ONLY cached objects with the specified tag (e.g., "test-isr")
     * - Path purge: Invalidates ONLY the specific path (e.g., "/test-isr")
     * - Other pages with different tags/paths remain cached and unaffected
     * 
     * This is fine-grained cache invalidation - you can purge specific pages
     * without affecting the rest of your site's cache.
     * 
     * Example:
     * - Page A has tag "blog-post-1" → purging "blog-post-1" only affects Page A
     * - Page B has tag "blog-post-2" → remains cached even after purging "blog-post-1"
     * - Homepage has no tag → remains cached regardless of other purges
     * 
     * According to Netlify docs: "On-demand invalidation across the entire network takes just a few seconds"
     * Rate limit: 2 purges per tag/site per 5 seconds
     */
    let purgeSuccess = false
    let rateLimited = false
    
    try {
      console.log(`🔄 Purging cache for tag: ${body.tag}`)
      await purgeCache({ tags: [body.tag] })
      console.log(`✅ Cache purged successfully for tag: ${body.tag}`)
      
      // Also purge by path if provided (as backup to ensure base path is invalidated)
      if (body.path) {
        try {
          console.log(`🔄 Purging cache for path: ${body.path}`)
          await purgeCache({ paths: [body.path] })
          console.log(`✅ Cache purged successfully for path: ${body.path}`)
        } catch (pathPurgeError) {
          // Non-critical - tag purge should be sufficient
          const pathErrorMsg = pathPurgeError instanceof Error ? pathPurgeError.message : String(pathPurgeError)
          if (pathErrorMsg.includes("rate limit") || pathErrorMsg.includes("429")) {
            console.warn(`⚠️ Path purge rate limited (non-critical): ${pathErrorMsg}`)
          } else {
            console.warn(`⚠️ Path purge failed (non-critical): ${pathErrorMsg}`)
          }
        }
      }
      
      purgeSuccess = true
    } catch (purgeError) {
      const errorMsg =
        purgeError instanceof Error
          ? purgeError.message
          : String(purgeError)
      console.error(`❌ purgeCache error for tag ${body.tag}:`, errorMsg)

      // If it's an auth token error, provide helpful message
      if (errorMsg.includes("token") || errorMsg.includes("auth")) {
        throw createError({
          statusCode: 401,
          statusMessage:
            "NETLIFY_AUTH_TOKEN invalid. Please check your Netlify environment variables.",
        })
      }
      
      /**
       * Step 2: Handle Rate Limiting
       * 
       * Netlify limits cache purges to 2 per tag/site per 5 seconds.
       * If we hit the rate limit, we wait 6 seconds and retry once.
       * This handles cases where multiple revalidations happen in quick succession.
       */
      if (errorMsg.includes("rate limit") || errorMsg.includes("429") || errorMsg.includes("too many")) {
        rateLimited = true
        console.warn(`⚠️ Rate limit hit, waiting 6 seconds before retry...`)
        
        // Wait 6 seconds (slightly more than 5 to be safe)
        await new Promise(resolve => setTimeout(resolve, 6000))
        
        try {
          console.log(`🔄 Retrying cache purge for tag: ${body.tag}`)
          await purgeCache({ tags: [body.tag] })
          console.log(`✅ Cache purged successfully for tag: ${body.tag} (after retry)`)
          purgeSuccess = true
        } catch (retryError) {
          const retryErrorMsg = retryError instanceof Error ? retryError.message : String(retryError)
          console.error(`❌ Retry also failed:`, retryErrorMsg)
          throw createError({
            statusCode: 429,
            statusMessage: "Rate limit exceeded. Please wait at least 5 seconds between revalidation attempts.",
          })
        }
      } else {
        throw purgeError
      }
    }
    
    if (!purgeSuccess) {
      throw createError({
        statusCode: 500,
        statusMessage: "Cache purge failed for unknown reason",
      })
    }

    /**
     * Step 3: Verify Purge Worked (Debugging)
     * 
     * After purging, we make a test request to check if the cache was actually invalidated.
     * This helps debug why subsequent purges might not be working.
     * 
     * We check:
     * - Overall cache status (hit/miss)
     * - Edge cache status (local edge node cache)
     * - Durable cache status (shared cache across all edge nodes)
     * 
     * If cache is still showing as "hit" after purge, it means:
     * - Purge hasn't propagated yet (needs more time)
     * - Or there's an issue with the purge
     * 
     * The client uses this information to adjust wait time before reloading.
     */
    if (body.path) {
      try {
        const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        
        // Wait 2 seconds for purge to propagate before checking
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const { getCacheStatus } = await import("@netlify/cache")
        
        // Make a test request with cache-busting headers to check actual cache status
        const testResponse = await fetch(`${siteUrl}${body.path}`, {
          method: "GET",
          headers: {
            "User-Agent": "Netlify-Revalidate-Check/1.0",
            "Cache-Control": "no-cache", // Bypass browser cache, but CDN will still check its cache
          },
        })
        
        // Get cache status from Netlify's cache utility
        const cacheInfo = getCacheStatus(testResponse)
        const cacheStatus = cacheInfo.hit ? "hit" : (cacheInfo.caches?.edge?.stale ? "stale" : "miss")
        
        console.log(`🔍 Cache status after purge: ${cacheStatus} (edge: ${cacheInfo.caches?.edge?.hit ? 'hit' : 'miss'}, durable: ${cacheInfo.caches?.durable?.hit ? 'hit' : 'miss'})`)
        
        // Return cache status in response so client can adjust behavior
        setResponseStatus(event, 202)
        return {
          message: "Cache purged successfully",
          tag: body.tag,
          path: body.path || "not specified",
          cacheStatus: {
            overall: cacheStatus,
            edge: cacheInfo.caches?.edge?.hit ? "hit" : "miss",
            durable: cacheInfo.caches?.durable?.hit ? "hit" : "miss",
          },
          note: cacheInfo.hit 
            ? "⚠️ Cache still showing as hit - purge may need more time to propagate"
            : "✅ Cache purged - next request should regenerate",
        }
      } catch (checkError) {
        // Non-critical - if cache check fails, we still return success
        // The purge itself succeeded, the check is just for debugging
        console.warn("⚠️ Could not check cache status:", checkError)
      }
    }

    // Return 202 Accepted - purge complete
    setResponseStatus(event, 202)
    return {
      message: "Cache purged successfully",
      tag: body.tag,
      path: body.path || "not specified",
      note: "The cache has been purged. You can reload to see the new content.",
    }
  } catch (error) {
    console.error("Revalidation error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    
    const statusCode = errorMessage.includes("Missing") ? 400 : 
                      errorMessage.includes("Rate limit") ? 429 :
                      errorMessage.includes("token") || errorMessage.includes("auth") ? 401 : 500
    
    throw createError({
      statusCode,
      statusMessage: `Cache purge failed: ${errorMessage}`,
    })
  }
})
