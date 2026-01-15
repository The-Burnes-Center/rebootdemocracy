/**
 * On-Demand Cache Revalidation Endpoint (Blog Posts + Weekly News Editions)
 * 
 * PURPOSE: When content changes in your CMS (e.g., Directus), this endpoint invalidates the
 * cached page(s) by Netlify cache tag, then attempts to regenerate key routes so users see
 * updated content quickly (without waiting for scheduled regeneration).
 * 
 * FLOW OVERVIEW:
 * 1. Parse request → Extract cache tag from webhook/API payload
 * 2. Validate tag → Ensure tag starts with "blog/" or "weekly-news/"
 * 3. Invalidate cache → Mark cached pages as stale by tag (plus related tags for listings)
 * 4. Check status → Verify invalidation worked by reading Cache-Status header
 * 5. Wait and retry → If cache still shows "hit", wait then retry purge and check again
 * 6. Regenerate → Force fresh SSR with cache-busting headers for related pages
 * 7. Cache result → Make normal request to populate cache with new content
 * 
 * WHY THIS APPROACH:
 * - Tag-only purge: CRITICAL - There is NO "paths" key in purgeCache, using it would invalidate entire site
 * - Tag formats:
 *   - Blog: "blog/{slug}", plus related "home" + "blog" (matches cache-tag.ts)
 *   - Weekly: "weekly-news/{edition|latest}", plus related "weekly-news" + "weekly-news/latest" (matches cache-tag.ts)
 * - Cache-Status header: Ground truth for CDN cache (not Cache API)
 * - Conditional wait: Only waits if invalidation hasn't propagated yet
 * - Cache-busting headers: Forces bypass of edge/durable cache during regeneration
 * - Final cache request: Ensures new content is cached for future visitors
 * 
 * USAGE:
 * POST /api/revalidate
 * Body: { tag: "blog/my-post-slug" } OR { tag: "weekly-news/85" }
 * 
 * TAG FORMAT:
 * - Must start with "blog/" or "weekly-news/"
 * This matches the format set in server/plugins/cache-tag.ts
 * 
 * WHAT GETS REVALIDATED:
 * - The specific blog post (tag: "blog/{slug}")
 * - Home page (tag: "home")
 * - Blog listing page (tag: "blog")
 * - Weekly news listing page (tag: "weekly-news")
 * - Weekly news latest page (tag: "weekly-news/latest")
 * - Weekly news edition page (tag: "weekly-news/{edition}")
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
     * Validate and process supported tags only
     *
     * Supported tag formats (see cache-tag.ts):
     * - Blog: "blog/{slug}"
     * - Weekly: "weekly-news/{edition|latest}"
     */
    const isBlog = tag.startsWith("blog/")
    const isWeekly = tag.startsWith("weekly-news/")
    if (!isBlog && !isWeekly) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid tag format. Expected tag starting with "blog/" or "weekly-news/" (e.g., "blog/my-post-slug" or "weekly-news/85"). Received: "${tag}"`,
      })
    }

    // Use tag as-is (no leading slash)
    const normalizedTag = tag

    // Allow explicit path override from webhook payloads, otherwise derive from tag
    const derivedPath = isBlog
      ? `/${normalizedTag}` // blog/{slug} -> /blog/{slug}
      : `/newsthatcaughtoureye/${normalizedTag.replace(/^weekly-news\//, "")}` // weekly-news/85 -> /newsthatcaughtoureye/85

    const primaryPath =
      body?.path || body?.payload?.path || body?.data?.path || derivedPath

    // Build related tags + pages to regenerate by content type
    const relatedTags = isBlog
      ? ["home", "blog", normalizedTag]
      : ["weekly-news", "weekly-news/latest", normalizedTag]

    const pathsToRegenerate = isBlog
      ? ["/", "/blog", primaryPath]
      : ["/newsthatcaughtoureye", "/newsthatcaughtoureye/latest", primaryPath]

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
        relatedTags: relatedTags,
        note: "Set NETLIFY_AUTH_TOKEN in Netlify environment variables for actual cache purging",
      }
    }

    /**
     * STEP 4: Invalidate Cache by Tags (Blog Post + Home + Blog Listing)
     * 
     * WHAT: Marks the cached pages as stale, so the next request triggers regeneration.
     * When a blog post changes, we also invalidate home page and blog listing since
     * they may display blog content (featured posts, recent posts, etc.).
     * 
     * WHY TAG-ONLY PURGE:
     * - Tag purge: Invalidates by Netlify-Cache-Tag header (matches "blog/{slug}", "home", "blog" formats)
     * - CRITICAL: There is NO "paths" key in purgeCache - using it would invalidate entire site
     * - Fine-grained: Only the specified pages are invalidated, other pages remain cached
     * 
     * WHY DUAL API CALLS (helper + direct):
     * - Helper (purgeCache): Clears CDN cache via @netlify/functions (tag only)
     * - Direct API: Also clears Cache API entries (programmatic cache layer, tag only)
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
     * Helper: Perform Complete Purge (Tag Only + Direct API)
     * 
     * WHY: Centralized purge function that we can call multiple times in retry loops.
     * CRITICAL: Only purge by tag (with tags key) to avoid invalidating entire site.
     * There is NO "paths" key in purgeCache - using it would invalidate the full cache.
     * 
     * UPDATED: Now accepts multiple tags to purge home, blog listing, and blog post together.
     */
    const performPurge = async (tags: string[]) => {
      try {
        // Purge by tags ONLY (CRITICAL: must include tags key to avoid full site invalidation)
        // NOTE: There is no "paths" key in purgeCache - using it would invalidate entire site
        console.log(`🔄 Purging CDN cache via helper for tags: ${tags.join(", ")}`)
        await purgeCache({ tags: tags })
        console.log(`✅ CDN cache purged successfully for tags: ${tags.join(", ")} (via helper)`)
        
        // Also purge via direct API (also uses tags only)
        await purgeViaDirectAPI(tags)
        
        return true
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`❌ Purge failed: ${errorMsg}`)
        return false
      }
    }
    
    /**
     * Helper: Purge via Direct Netlify API
     * 
     * WHY: The purgeCache helper may not clear Cache API entries (programmatic cache).
     * This direct API call ensures both CDN cache AND Cache API are cleared.
     * 
     * UPDATED: Now accepts multiple tags to purge home, blog listing, and blog post together.
     */
    const purgeViaDirectAPI = async (purgeTags: string[]) => {
      if (!siteId && !siteSlug) {
        console.warn(`⚠️ Site ID/Slug not found - skipping direct API purge. Set NETLIFY_SITE_ID or NETLIFY_SITE_NAME env var.`)
        return false
      }
      console.log(`🔄 Purging CDN cache via direct API for tags: ${purgeTags.join(", ")}`)
      try {
        const purgeApiUrl = "https://api.netlify.com/api/v1/purge"
        const purgePayload: any = {
          cache_tags: purgeTags,
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
          console.log(`✅ Cache purged successfully via direct API for tags: ${purgeTags.join(", ")}`)
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
      // Initial purge attempt (tags only - no path purging to avoid full site invalidation)
      console.log(`🔄 Purging cache for tags: ${relatedTags.join(", ")}`)
      purgeSuccess = await performPurge(relatedTags)
    } catch (purgeError) {
      const errorMsg =
        purgeError instanceof Error
          ? purgeError.message
          : String(purgeError)
      console.error(`❌ purgeCache error for tags ${relatedTags.join(", ")}:`, errorMsg)

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
          console.log(`🔄 Retrying cache purge for tags: ${relatedTags.join(", ")}`)
          purgeSuccess = await performPurge(relatedTags)
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
       * Helper: Check Cache Status
       * 
       * Returns the overall cache status after making a test request.
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
       * 
       * UPDATED: Now checks the blog post path (primary page being revalidated).
       */
      const checkCacheStatus = async (checkPath: string): Promise<{ overall: string; edge: string; durable: string; headers: string[] }> => {
        const testResponse = await fetch(`${siteUrl}${checkPath}`, {
          method: "GET",
          headers: {
            "User-Agent": "Netlify-Revalidate-Check/1.0",
            "Cache-Control": "no-cache", // Bypass browser cache, but CDN will still check its cache
          },
        })
        
        const cacheStatusHeader = testResponse.headers.get("Cache-Status") || ""
        console.log(`🔍 Cache-Status header: ${cacheStatusHeader}`)
        // Parse Cache-Status header(s)
        let cacheStatusHeaders: string[] = []
        if (cacheStatusHeader) {
          if (cacheStatusHeader.includes('"Netlify Edge') && cacheStatusHeader.includes('"Netlify Durable')) {
            const parts = cacheStatusHeader.split(/(?="Netlify)/)
            cacheStatusHeaders = parts.filter(p => p.trim().startsWith('"Netlify'))
          } else {
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
        
        return {
          overall: overallStatus,
          edge: edgeStatus,
          durable: durableStatus,
          headers: cacheStatusHeaders,
        }
      }
      
      // Initial cache status check (check primary page)
      console.log(`🔍 Checking cache status after purge for: ${primaryPath}`)
      let cacheStatus = await checkCacheStatus(primaryPath)
      console.log(`🔍 CDN Cache status after purge: ${cacheStatus.overall} (edge: ${cacheStatus.edge}, durable: ${cacheStatus.durable})`)
      console.log(`📋 Cache-Status headers: ${cacheStatus.headers.join(", ")}`)
      
      /**
       * STEP 7: Wait and Re-check Cache Status
       * 
       * WHY: If cache still shows "hit", invalidation hasn't propagated across all
       * CDN nodes yet. We wait, then CHECK AGAIN. We do NOT re-purge, just wait and check.
       * 
       * LOGIC:
       * - "stale" or "miss" → Invalidation worked → Proceed immediately (0s wait)
       * - "hit" → Wait 20s, then CHECK cache status again
       * - If still "hit" after wait → Wait again and check (no re-purge)
       * - Max 3 checks to avoid infinite loops
       */
      const MAX_CHECKS = 3
      let currentCacheStatus = cacheStatus
      let checkCount = 0
      
      while (currentCacheStatus.overall === 'hit' && checkCount < MAX_CHECKS) {
        // Wait before checking again (20s first time, then 10s for subsequent checks)
        const waitTime = checkCount === 0 ? 20000 : 10000
        console.log(`⏳ Waiting ${waitTime/1000}s before checking cache status again (CDN cache: ${currentCacheStatus.overall}, purge propagating...)`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        // Check cache status again
        console.log(`🔍 Re-checking cache status (check ${checkCount + 1}/${MAX_CHECKS})...`)
        currentCacheStatus = await checkCacheStatus(primaryPath)
        console.log(`🔍 CDN Cache status after wait: ${currentCacheStatus.overall} (edge: ${currentCacheStatus.edge}, durable: ${currentCacheStatus.durable})`)
        console.log(`📋 Cache-Status headers: ${currentCacheStatus.headers.join(", ")}`)
        
        checkCount++
      }
      
      // Update cacheStatus for return value
      cacheStatus.overall = currentCacheStatus.overall
      cacheStatus.edge = currentCacheStatus.edge
      cacheStatus.durable = currentCacheStatus.durable
      
      if (currentCacheStatus.overall === 'stale' || currentCacheStatus.overall === 'miss') {
        console.log(`✅ Purge worked (CDN cache: ${currentCacheStatus.overall}) - proceeding to regeneration`)
      } else {
        console.warn(`⚠️ Cache still shows "hit" after ${MAX_CHECKS} checks - proceeding anyway (may serve stale content)`)
      }
      
      
      /**
       * STEP 8: Trigger Regeneration (Force Fresh SSR for All Pages)
       * 
       * WHY: We need to force a fresh server-side render for home page, blog listing,
       * and the specific blog post, bypassing any remaining cache entries. Aggressive
       * cache-busting headers ensure we get fresh content.
       * 
       * HEADERS EXPLAINED:
       * - Cache-Control: no-cache, no-store, must-revalidate → Bypass all caches
       * - Pragma: no-cache → HTTP/1.0 compatibility (older proxies)
       * - Expires: 0 → Tell caches content is expired
       * - X-Cache-Bypass: timestamp → Unique value to prevent cache matching
       * - cache: 'no-store' → Don't store response in any cache
       */
      const regeneratePage = async (pagePath: string, pageName: string) => {
        console.log(`🔄 Triggering regeneration for ${pageName}: ${pagePath}`)
        const regenerateResponse = await fetch(`${siteUrl}${pagePath}`, {
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
          console.log(`✅ ${pageName} regenerated successfully: ${pagePath} (${regenerateText.length} bytes)`)
          
          /**
           * STEP 9: Cache the Regenerated Page
           * 
           * WHY: The regeneration request used cache-busting headers, so it wasn't cached.
           * We make a normal request (without cache-busting) to populate the cache with
           * the fresh content for future visitors.
           */
          console.log(`🔄 Caching regenerated ${pageName}...`)
          const cacheRequest = await fetch(`${siteUrl}${pagePath}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Netlify-Revalidate-Cache/1.0',
            },
          })
          
          // Check if the page is cached
          const cacheCheckHeader = cacheRequest.headers.get("Cache-Status") || ""
          const isCached = cacheCheckHeader.includes('hit') && !cacheCheckHeader.includes('fwd=stale')
          console.log(`📋 Cache check for ${pageName}: ${isCached ? '✅ Page is cached' : '⚠️ Page may not be cached yet'} (Cache-Status: ${cacheCheckHeader})`)
          
          return { success: true, isCached, cacheCheckHeader }
        } else {
          console.warn(`⚠️ ${pageName} regeneration returned status ${regenerateStatus} or empty content`)
          return { success: false, isCached: false, cacheCheckHeader: "" }
        }
      }
      
      // Regenerate all three pages: home, blog listing, and blog post
      const regenTargets = isBlog
        ? [
            { path: "/", name: "Home page", key: "home" },
            { path: "/blog", name: "Blog listing page", key: "blogListing" },
            { path: primaryPath, name: "Blog post", key: "primary" },
          ]
        : [
            { path: "/newsthatcaughtoureye", name: "Weekly news listing page", key: "weeklyListing" },
            { path: "/newsthatcaughtoureye/latest", name: "Weekly news latest page", key: "weeklyLatest" },
            { path: primaryPath, name: "Weekly news edition page", key: "primary" },
          ]

      const regenerationResults: Record<string, any> = {}
      for (const t of regenTargets) {
        regenerationResults[t.key] = await regeneratePage(t.path, t.name)
      }

      const allRegenerated = regenTargets.every((t) => regenerationResults[t.key]?.success)
      
      if (allRegenerated) {
        // Optional warm-up: apply to both blog + weekly-news
        if (isBlog || isWeekly) {
          try {
            console.log(`🔥 Warming up cache for revalidated tag: ${normalizedTag}`)
            const warmCacheUrl = `${siteUrl}/api/warm-cache`
            const warmCacheResponse = await fetch(warmCacheUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Netlify-Revalidate/1.0',
              },
              body: JSON.stringify({ tag: normalizedTag }),
            })
            
            if (warmCacheResponse.ok) {
              await warmCacheResponse.json().catch(() => null)
              console.log(`✅ Cache warmed up for tag: ${normalizedTag}`)
            } else {
              console.warn(`⚠️ Cache warm-up returned status ${warmCacheResponse.status} (non-critical)`)
            }
          } catch (warmError) {
            // Non-critical - page is already regenerated and cached
            const warmErrorMsg = warmError instanceof Error ? warmError.message : String(warmError)
            console.warn(`⚠️ Could not warm up cache (non-critical): ${warmErrorMsg}`)
          }
        }
        
        // Return success with cache status
        setResponseStatus(event, 202)
        return {
          message: "Cache purged and all pages regenerated successfully",
          tag: normalizedTag,
          relatedTags: relatedTags,
          paths: pathsToRegenerate,
          regenerated: true,
          cacheStatus: cacheStatus,
          regenerationResults: {
            ...(isBlog
              ? {
                  home: { cached: regenerationResults.home.isCached },
                  blogListing: { cached: regenerationResults.blogListing.isCached },
                  blogPost: { cached: regenerationResults.primary.isCached },
                }
              : {
                  weeklyListing: { cached: regenerationResults.weeklyListing.isCached },
                  weeklyLatest: { cached: regenerationResults.weeklyLatest.isCached },
                  weeklyEdition: { cached: regenerationResults.primary.isCached },
                }),
          },
          note: isBlog
            ? "✅ All pages regenerated and warmed up (home, blog listing, and blog post)"
            : "✅ All pages regenerated (weekly listing, weekly latest, and edition page)",
        }
      } else {
        console.warn(`⚠️ Some pages failed to regenerate. Targets: ${regenTargets.map((t) => `${t.key}=${regenerationResults[t.key]?.success}`).join(", ")}`)
      }
    } catch (regenerateError) {
      /**
       * STEP 11: Handle Regeneration Errors (Non-Critical)
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
     * WHY: Cache invalidation succeeded, so the pages will regenerate on next request.
     * We return 202 (Accepted) to indicate the operation was accepted, even if we
     * couldn't trigger immediate regeneration.
     */
    setResponseStatus(event, 202)
    return {
      message: "Cache purged successfully",
      tag: normalizedTag,
      relatedTags: relatedTags,
      paths: pathsToRegenerate,
      note: "The cache has been purged for home page, blog listing, and blog post. Pages will regenerate on next request.",
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
