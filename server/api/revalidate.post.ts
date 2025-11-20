/**
 * On-Demand Cache Revalidation Endpoint (Blog Posts Only)
 * 
 * PURPOSE: When blog content changes in your CMS (e.g., Directus), this endpoint invalidates
 * the cached blog page and immediately regenerates it with fresh content. This ensures users
 * see updated content without waiting for the next scheduled regeneration.
 * 
 * FLOW OVERVIEW:
 * 1. Parse request → Extract blog cache tag from webhook/API payload
 * 2. Validate tag → Ensure tag starts with "blog/" (e.g., "blog/my-post-slug")
 * 3. Invalidate cache → Mark cached blog page as stale by tag
 * 4. Check status → Verify invalidation worked by reading Cache-Status header
 * 5. Wait if needed → If cache still shows "hit", wait for invalidation to propagate
 * 6. Regenerate → Force fresh SSR with cache-busting headers
 * 7. Cache result → Make normal request to populate cache with new content
 * 
 * WHY THIS APPROACH:
 * - Blog-only: Only handles blog routes (tags starting with "blog/")
 * - Tag-based invalidation: Only affects the specific blog post, not entire site
 * - Tag format: "blog/{slug}" (no leading slash) - matches server/plugins/cache-tag.ts
 * - Cache-Status header: Ground truth for CDN cache (not Cache API)
 * - Conditional wait: Only waits if invalidation hasn't propagated yet
 * - Cache-busting headers: Forces bypass of edge/durable cache during regeneration
 * - Final cache request: Ensures new content is cached for future visitors
 * 
 * USAGE:
 * POST /api/revalidate
 * Body: { tag: "blog/my-post-slug" }
 * 
 * TAG FORMAT: Must start with "blog/" (e.g., "blog/googleorg-support-to-train-more-government-workers-in-digital-skills")
 * This matches the format set in server/plugins/cache-tag.ts
 * 
 * RATE LIMITS: 2 purges per tag/site per 5 seconds (auto-retry with 6s wait)
 * 
 * ENV VARS: NETLIFY_AUTH_TOKEN (required for actual purging)
 */
import { purgeCache } from "@netlify/functions"

export default defineEventHandler(async (event) => {
  try {
    let rawBody = await readBody(event)
    
    /**
     * STEP 1: Parse Request Body
     * 
     * WHY: Directus webhooks may send JSON as a string (Content-Type: text/plain)
     * instead of application/json. We handle both formats for compatibility.
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
     * STEP 2: Extract Cache Tag
     * 
     * WHY: Different webhook formats nest the tag differently. We check multiple
     * locations (body.tag, body.payload.tag, body.data.tag) to support all formats.
     * 
     * The tag identifies which cached page to invalidate (e.g., "blog/my-post").
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

    /**
     * Validate and process blog tags only
     * 
     * Blog tags use format: "blog/{slug}" (e.g., "blog/my-post-slug")
     * This matches the format set in server/plugins/cache-tag.ts
     * 
     * WHY: We only handle blog routes. Other routes should use different revalidation logic.
     */
    if (!tag.startsWith("blog/")) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid tag format. Expected blog tag starting with "blog/" (e.g., "blog/my-post-slug"). Received: "${tag}"`,
      })
    }

    // Construct path from blog tag (e.g., "blog/my-post" -> "/blog/my-post")
    // WHY: Path needs leading slash for URL, but tag doesn't have it
    const path = body?.path || body?.payload?.path || body?.data?.path || `/${tag}`
    
    // Use tag as-is (blog tags are "blog/{slug}" format, no leading slash)
    const normalizedTag = tag

    /**
     * STEP 3: Verify Authentication
     * 
     * WHY: Cache purging requires Netlify API access. Without the token, we can't
     * actually purge, so we return early with a helpful message.
     */
    const authToken = process.env.NETLIFY_AUTH_TOKEN
    if (!authToken) {
      console.warn("NETLIFY_AUTH_TOKEN not set - cache purge will be simulated")
      setResponseStatus(event, 202)
      return {
        message: "Cache purge simulated (NETLIFY_AUTH_TOKEN not configured)",
        tag: normalizedTag,
        note: "Set NETLIFY_AUTH_TOKEN in Netlify environment variables for actual cache purging",
      }
    }

    /**
     * STEP 4: Invalidate Cache by Blog Tag
     * 
     * WHAT: Marks the cached blog page as stale, so the next request triggers regeneration.
     * 
     * WHY TAG-BASED ONLY:
     * - Tag purge: Invalidates by Netlify-Cache-Tag header (matches "blog/{slug}" format)
     * - Fine-grained: Only the specified blog post is invalidated, other pages remain cached
     * 
     * WHY DUAL API CALLS (helper + direct):
     * - Helper (purgeCache): Clears CDN cache via @netlify/functions
     * - Direct API: Also clears Cache API entries (programmatic cache layer)
     * 
     * RATE LIMIT: 2 purges per tag/site per 5 seconds (handled below)
     */
    let purgeSuccess = false
    let rateLimited = false
    
    // Get site identifier for direct API call
    // Netlify automatically provides these in environment variables
    const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID
    const siteSlug = process.env.NETLIFY_SITE_NAME || process.env.SITE_NAME
    
    /**
     * Helper: Purge via Direct Netlify API
     * 
     * WHY: The purgeCache helper may not clear Cache API entries (programmatic cache).
     * This direct API call ensures both CDN cache AND Cache API are cleared.
     */
    const purgeViaDirectAPI = async (purgeTag: string) => {
      if (!siteId && !siteSlug) {
        console.warn(`⚠️ Site ID/Slug not found - skipping direct API purge. Set NETLIFY_SITE_ID or NETLIFY_SITE_NAME env var.`)
        return false
      }
      
      try {
        const purgeApiUrl = "https://api.netlify.com/api/v1/purge"
        const purgePayload: any = {
          cache_tags: [purgeTag],
        }
        
        // Add site identifier (either site_id or site_slug)
        if (siteId) {
          purgePayload.site_id = siteId
        } else if (siteSlug) {
          purgePayload.site_slug = siteSlug
        }
        
        const apiResponse = await fetch(purgeApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(purgePayload),
        })
        
        if (apiResponse.ok) {
          console.log(`✅ Cache purged successfully via direct API for tag: ${purgeTag}`)
          return true
        } else {
          const errorText = await apiResponse.text()
          console.warn(`⚠️ Direct API purge returned ${apiResponse.status}: ${errorText}`)
          return false
        }
      } catch (apiError) {
        // Non-critical - helper purge should be sufficient
        const apiErrorMsg = apiError instanceof Error ? apiError.message : String(apiError)
        console.warn(`⚠️ Direct API purge failed (non-critical): ${apiErrorMsg}`)
        return false
      }
    }
    
    try {
      // Method 1: Purge using purgeCache helper (CDN cache)
      console.log(`🔄 Purging CDN cache via helper for blog tag: ${normalizedTag}`)
      await purgeCache({ tags: [normalizedTag] })
      console.log(`✅ CDN cache purged successfully for blog tag: ${normalizedTag} (via helper)`)
      
      // Method 2: Purge using direct API call (CDN cache + Cache API)
      // This ensures we also clear any Cache API entries
      await purgeViaDirectAPI(normalizedTag)
      
      purgeSuccess = true
    } catch (purgeError) {
      const errorMsg =
        purgeError instanceof Error
          ? purgeError.message
          : String(purgeError)
      console.error(`❌ purgeCache error for blog tag ${normalizedTag}:`, errorMsg)

      // If it's an auth token error, provide helpful message
      if (errorMsg.includes("token") || errorMsg.includes("auth")) {
        throw createError({
          statusCode: 401,
          statusMessage:
            "NETLIFY_AUTH_TOKEN invalid. Please check your Netlify environment variables.",
        })
      }
      
      /**
       * STEP 5: Handle Rate Limiting
       * 
       * WHY: Netlify limits to 2 purges per tag/site per 5 seconds to prevent abuse.
       * If we hit the limit, we wait 6 seconds (slightly more than 5) and retry once.
       * This handles cases where multiple webhooks fire in quick succession.
       */
      if (errorMsg.includes("rate limit") || errorMsg.includes("429") || errorMsg.includes("too many")) {
        rateLimited = true
        console.warn(`⚠️ Rate limit hit, waiting 6 seconds before retry...`)
        
        // Wait 6 seconds (slightly more than 5 to be safe)
        await new Promise(resolve => setTimeout(resolve, 6000))
        
        try {
          console.log(`🔄 Retrying cache purge for blog tag: ${normalizedTag}`)
          // Retry both methods
          await purgeCache({ tags: [normalizedTag] })
          console.log(`✅ Cache purged successfully for blog tag: ${normalizedTag} (after retry via helper)`)
          
          // Also retry direct API call
          await purgeViaDirectAPI(normalizedTag)
          
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
     * STEP 6: Check Cache Status
     * 
     * WHY: We need to verify the invalidation worked before regenerating. If the cache
     * still shows "hit", the invalidation hasn't propagated yet and we should wait.
     * 
     * HOW: We make a test request and read the Cache-Status header (ground truth for CDN).
     * We wait 2 seconds first to give the purge time to propagate across Netlify's network.
     */
    const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
    const protocol = event.headers.get("x-forwarded-proto") || "http"
    const siteUrl = `${protocol}://${host}`
    
    try {
      // Wait 2 seconds for purge to propagate across Netlify's CDN network
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      /**
       * Read Cache-Status Header (Ground Truth for CDN Cache)
       * 
       * WHY: Cache-Status is the actual CDN cache status, not the Cache API status.
       * We use this to determine if invalidation worked.
       * 
       * VALUES:
       * - "hit" (no fwd=stale): Cache still has fresh content → invalidation hasn't propagated
       * - "fwd=stale": Cache recognized stale content, fetched fresh → invalidation worked
       * - "fwd=miss": Cache is empty → invalidation worked
       * 
       * We check both "Netlify Edge" (local node cache) and "Netlify Durable" (shared cache).
       */
      const testResponse = await fetch(`${siteUrl}${path}`, {
        method: "GET",
        headers: {
          "User-Agent": "Netlify-Revalidate-Check/1.0",
          "Cache-Control": "no-cache", // Bypass browser cache, but CDN will still check its cache
        },
      })
      
      // Get Cache-Status header (ground truth for CDN cache)
      const cacheStatusHeader = testResponse.headers.get("Cache-Status") || ""
      
      // Parse Cache-Status header(s)
      // WHY: Netlify sends separate headers for Edge and Durable, but fetch API
      // may combine them. We handle both single and combined formats.
      let cacheStatusHeaders: string[] = []
      if (cacheStatusHeader) {
        // Check if it contains both "Netlify Edge" and "Netlify Durable" (combined)
        // If so, split by looking for "Netlify" as delimiter
        if (cacheStatusHeader.includes('"Netlify Edge') && cacheStatusHeader.includes('"Netlify Durable')) {
          // Split by "Netlify" (but keep the prefix)
          const parts = cacheStatusHeader.split(/(?="Netlify)/)
          cacheStatusHeaders = parts.filter(p => p.trim().startsWith('"Netlify'))
        } else {
          // Single header or comma-separated
          cacheStatusHeaders = cacheStatusHeader.split(',').map(h => h.trim()).filter(Boolean)
        }
      }
      
      // Parse Cache-Status headers
      let edgeStatus = "unknown"
      let durableStatus = "unknown"
      let overallStatus = "unknown"
      
      for (const header of cacheStatusHeaders) {
        if (header.includes("Netlify Edge")) {
          if (header.includes("hit") && !header.includes("fwd=stale")) {
            edgeStatus = "hit"
          } else if (header.includes("fwd=stale")) {
            edgeStatus = "stale"
          } else if (header.includes("fwd=miss")) {
            edgeStatus = "miss"
          }
        }
        if (header.includes("Netlify Durable")) {
          if (header.includes("hit") && !header.includes("fwd=stale")) {
            durableStatus = "hit"
          } else if (header.includes("fwd=stale")) {
            durableStatus = "stale"
          } else if (header.includes("fwd=miss")) {
            durableStatus = "miss"
          }
        }
      }
      
      // Determine overall status
      if (edgeStatus === "hit" || durableStatus === "hit") {
        overallStatus = "hit"
      } else if (edgeStatus === "stale" || durableStatus === "stale") {
        overallStatus = "stale"
      } else {
        overallStatus = "miss"
      }
      
      const cacheStatus = {
        overall: overallStatus,
        edge: edgeStatus,
        durable: durableStatus,
        headers: cacheStatusHeaders, // Include raw headers for debugging
      }
      
      console.log(`🔍 CDN Cache status after purge: ${overallStatus} (edge: ${cacheStatus.edge}, durable: ${cacheStatus.durable})`)
      console.log(`📋 Cache-Status headers: ${cacheStatusHeaders.join(", ")}`)
      
      /**
       * STEP 7: Wait Based on Cache Status
       * 
       * WHY: If cache still shows "hit", invalidation hasn't propagated across all
       * CDN nodes yet. We wait 20s to give it time. If "stale" or "miss", we proceed
       * immediately because invalidation worked.
       * 
       * LOGIC:
       * - "stale" or "miss" → Invalidation worked → Proceed immediately (0s wait)
       * - "hit" → Invalidation hasn't propagated → Wait 20s for propagation
       */
      const purgeWorked = overallStatus === 'stale' || overallStatus === 'miss'
      if (purgeWorked) {
        console.log(`✅ Purge worked (CDN cache: ${overallStatus}) - proceeding immediately to regeneration`)
      } else {
        // Only wait if cache is still "hit" (purge hasn't propagated yet)
        const waitTime = 20000 // 20s if still hit
        console.log(`⏳ Waiting ${waitTime/1000}s before regeneration (CDN cache: ${overallStatus}, purge propagating...)`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      
      
      /**
       * STEP 8: Trigger Regeneration (Force Fresh SSR)
       * 
       * WHY: We need to force a fresh server-side render, bypassing any remaining
       * cache entries. Aggressive cache-busting headers ensure we get fresh content.
       * 
       * HEADERS EXPLAINED:
       * - Cache-Control: no-cache, no-store, must-revalidate → Bypass all caches
       * - Pragma: no-cache → HTTP/1.0 compatibility (older proxies)
       * - Expires: 0 → Tell caches content is expired
       * - X-Cache-Bypass: timestamp → Unique value to prevent cache matching
       * - cache: 'no-store' → Don't store response in any cache
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
        
        /**
         * STEP 9: Cache the Regenerated Page
         * 
         * WHY: The regeneration request used cache-busting headers, so it wasn't cached.
         * We make a normal request (without cache-busting) to populate the cache with
         * the fresh content for future visitors.
         */
        console.log(`🔄 Caching regenerated page...`)
        const cacheRequest = await fetch(`${siteUrl}${path}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Netlify-Revalidate-Cache/1.0',
          },
        })
        
        // Check if the page is cached
        const cacheCheckHeader = cacheRequest.headers.get("Cache-Status") || ""
        const isCached = cacheCheckHeader.includes('hit') && !cacheCheckHeader.includes('fwd=stale')
        console.log(`📋 Cache check: ${isCached ? '✅ Page is cached' : '⚠️ Page may not be cached yet'} (Cache-Status: ${cacheCheckHeader})`)
        
        // Return success with cache status
        setResponseStatus(event, 202)
        return {
          message: "Cache purged and page regenerated successfully",
          tag: normalizedTag,
          path: path,
          regenerated: true,
          cacheStatus: cacheStatus,
          isCached: isCached,
          cacheCheckHeader: cacheCheckHeader,
          note: "✅ Page regenerated (same process as button click)",
        }
      } else {
        console.warn(`⚠️ Regeneration returned status ${regenerateStatus} or empty content`)
      }
    } catch (regenerateError) {
      /**
       * STEP 10: Handle Regeneration Errors (Non-Critical)
       * 
       * WHY: If regeneration fails, we still return success because the cache was
       * invalidated. The page will regenerate automatically on the next user request.
       * This prevents webhook failures from blocking cache invalidation.
       */
      const errorMsg = regenerateError instanceof Error ? regenerateError.message : String(regenerateError)
      console.warn(`⚠️ Could not trigger regeneration (non-critical): ${errorMsg}`)
    }

    /**
     * FALLBACK: Return Success Even If Regeneration Wasn't Attempted
     * 
     * WHY: Cache invalidation succeeded, so the page will regenerate on next request.
     * We return 202 (Accepted) to indicate the operation was accepted, even if we
     * couldn't trigger immediate regeneration.
     */
    setResponseStatus(event, 202)
    return {
      message: "Cache purged successfully",
      tag: normalizedTag,
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

