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
    let rawBody = await readBody(event)
    
    /**
     * Handle String Bodies (text/plain Content-Type)
     * 
     * Directus webhooks sometimes send the body as a string with Content-Type: text/plain
     * instead of application/json. We need to parse it manually.
     */
    let body: any = rawBody
    
    if (typeof rawBody === 'string') {
      try {
        const trimmed = rawBody.trim()
        body = JSON.parse(trimmed)
        console.log(`📦 Parsed string body:`, body)
      } catch (parseError) {
        console.error("❌ Failed to parse body as JSON:", parseError)
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid JSON in request body. Expected JSON object with 'tag' field.",
        })
      }
    }

    /**
     * Extract Cache Tag from Request Body
     * 
     * Supports multiple payload formats:
     * 1. Direct API: { tag: "test-isr", path: "/test-isr" }
     * 2. Directus webhook: { tag: "test-isr" }
     * 3. Directus webhook with payload: { payload: { tag: "test-isr" } }
     */
    let tag: string | undefined = body?.tag
    
    // Try nested payload formats (common in Directus webhooks)
    if (!tag && body?.payload?.tag) {
      tag = body.payload.tag
    }
    if (!tag && body?.data?.tag) {
      tag = body.data.tag
    }

    if (!tag) {
      console.error("❌ Missing tag parameter. Received body:", JSON.stringify(body, null, 2))
      throw createError({
        statusCode: 400,
        statusMessage: "Missing tag parameter. Expected: { tag: 'cache-tag' }",
      })
    }

    // Extract path if provided, otherwise construct from tag (e.g., "test-isr" -> "/test-isr")
    const path = body?.path || body?.payload?.path || body?.data?.path || (tag.startsWith("/") ? tag : `/${tag}`)

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
      console.log(`🔄 Purging cache for tag: ${tag}`)
      await purgeCache({ tags: [tag] })
      console.log(`✅ Cache purged successfully for tag: ${tag}`)
      
      // Always purge by path (construct from tag if not provided) - EXACT same as button
      try {
        console.log(`🔄 Purging cache for path: ${path}`)
        await purgeCache({ paths: [path] })
        console.log(`✅ Cache purged successfully for path: ${path}`)
      } catch (pathPurgeError) {
        // Non-critical - tag purge should be sufficient
        const pathErrorMsg = pathPurgeError instanceof Error ? pathPurgeError.message : String(pathPurgeError)
        if (pathErrorMsg.includes("rate limit") || pathErrorMsg.includes("429")) {
          console.warn(`⚠️ Path purge rate limited (non-critical): ${pathErrorMsg}`)
        } else {
          console.warn(`⚠️ Path purge failed (non-critical): ${pathErrorMsg}`)
        }
      }
      
      purgeSuccess = true
    } catch (purgeError) {
      const errorMsg =
        purgeError instanceof Error
          ? purgeError.message
          : String(purgeError)
      console.error(`❌ purgeCache error for tag ${tag}:`, errorMsg)

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
          console.log(`🔄 Retrying cache purge for tag: ${tag}`)
          await purgeCache({ tags: [tag] })
          console.log(`✅ Cache purged successfully for tag: ${tag} (after retry)`)
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
     * Step 3: Check Cache Status (EXACT Same as Button Process)
     * 
     * After purging, we check the cache status to determine how long to wait.
     * This matches the EXACT process from the button click.
     */
    const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
    const protocol = event.headers.get("x-forwarded-proto") || "http"
    const siteUrl = `${protocol}://${host}`
    
    try {
      // Wait 2 seconds for purge to propagate before checking (EXACT same as button)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { getCacheStatus } = await import("@netlify/cache")
      
      // Make a test request to check cache status (EXACT same as button)
      const testResponse = await fetch(`${siteUrl}${path}`, {
        method: "GET",
        headers: {
          "User-Agent": "Netlify-Revalidate-Check/1.0",
          "Cache-Control": "no-cache", // Bypass browser cache, but CDN will still check its cache
        },
      })
      
      // Get cache status from Netlify's cache utility
      const cacheInfo = getCacheStatus(testResponse)
      const overallStatus = cacheInfo.hit ? "hit" : (cacheInfo.caches?.edge?.stale ? "stale" : "miss")
      
      const cacheStatus = {
        overall: overallStatus,
        edge: cacheInfo.caches?.edge?.hit ? "hit" : "miss",
        durable: cacheInfo.caches?.durable?.hit ? "hit" : "miss",
      }
      
      console.log(`🔍 Cache status after purge: ${overallStatus} (edge: ${cacheStatus.edge}, durable: ${cacheStatus.durable})`)
      
      /**
       * Step 4: Wait Based on Cache Status (EXACT Same as Button Process)
       * 
       * This matches the EXACT wait time logic from the button:
       * - If cache is still "hit": wait 20 seconds (purge needs more time to propagate)
       * - If cache is "miss": wait 15 seconds (purge propagated, ready to regenerate)
       */
      const waitTime = overallStatus === 'hit' ? 20000 : 15000
      console.log(`⏳ Waiting ${waitTime/1000}s before regeneration (cache status: ${overallStatus})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      /**
       * Step 5: Trigger Regeneration (Aggressive Cache-Busting to Bypass Edge Cache)
       * 
       * Uses aggressive cache-busting headers to ensure we bypass both edge cache
       * and durable cache, forcing a fresh SSR regeneration.
       * 
       * Headers:
       * - Cache-Control: no-cache, no-store, must-revalidate - Bypass all caches
       * - Pragma: no-cache - HTTP/1.0 cache control
       * - Expires: 0 - Tell caches content is expired
       * - X-Cache-Bypass: unique timestamp - Additional header to force bypass
       * - cache: 'no-store' - Don't store in any cache
       */
      console.log(`🔄 Triggering regeneration for: ${path}`)
      const regenerateResponse = await fetch(`${siteUrl}${path}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate', // Aggressive: bypass all caches
          'Pragma': 'no-cache', // HTTP/1.0 cache control
          'Expires': '0', // Tell caches content is expired
          'X-Cache-Bypass': Date.now().toString(), // Unique header to force bypass
        },
        cache: 'no-store' // Don't store in any cache
      })
      
      const regenerateStatus = regenerateResponse.status
      const regenerateText = await regenerateResponse.text()
      const hasContent = regenerateText.length > 0
      
      if (regenerateStatus === 200 && hasContent) {
        console.log(`✅ Page regenerated successfully: ${path} (${regenerateText.length} bytes)`)
        
        // Make a normal request to cache the regenerated page (replaces button's window.location.reload())
        // This ensures the new page is cached for future visitors
        console.log(`🔄 Caching regenerated page...`)
        await fetch(`${siteUrl}${path}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Netlify-Revalidate-Cache/1.0',
          },
        })
        
        // Return success with cache status
        setResponseStatus(event, 202)
        return {
          message: "Cache purged and page regenerated successfully",
          tag: tag,
          path: path,
          regenerated: true,
          cacheStatus: cacheStatus,
          note: "✅ Page regenerated (same process as button click)",
        }
      } else {
        console.warn(`⚠️ Regeneration returned status ${regenerateStatus} or empty content`)
      }
    } catch (regenerateError) {
      // Non-critical - if regeneration fails, we still return success
      // The purge succeeded, and the page will regenerate on next request anyway
      const errorMsg = regenerateError instanceof Error ? regenerateError.message : String(regenerateError)
      console.warn(`⚠️ Could not trigger regeneration (non-critical): ${errorMsg}`)
    }

    // Return 202 Accepted - purge complete
    // If we got here, purge succeeded but regeneration may not have been attempted
    setResponseStatus(event, 202)
    return {
      message: "Cache purged successfully",
      tag: tag,
      path: path,
      note: "The cache has been purged. Page will regenerate on next request.",
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
