import { purgeCache } from "@netlify/functions"

/**
 * On-demand cache revalidation endpoint
 * 
 * Based on Netlify's recommended approach:
 * https://docs.netlify.com/build/caching/caching-overview/#on-demand-invalidation
 * 
 * Purges cached objects by tag. After purge, the next request will hit the server
 * and regenerate the page, which will then be cached again.
 */
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

    // Purge cache by tag AND by path for maximum reliability
    // According to Netlify docs: "On-demand invalidation across the entire network takes just a few seconds"
    // Rate limit: 2 purges per tag/site per 5 seconds
    // We purge by both tag and path to ensure complete invalidation
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
      
      // If it's a rate limit error, wait and retry once
      // Rate limit: 2 purges per tag/site per 5 seconds
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

    // After purge, trigger regeneration using the same approach as warm-up
    // Wait for purge to propagate, then make a server-side request to regenerate the page
    if (body.path) {
      try {
        const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        
        // Wait longer for purge to propagate - Netlify says "a few seconds" but can take up to 60 seconds
        // We'll wait up to 60 seconds total, checking every 5 seconds
        const maxWaitTime = 60000 // 60 seconds
        const checkInterval = 5000 // Check every 5 seconds
        const maxChecks = maxWaitTime / checkInterval // 12 checks
        
        console.log(`⏳ Waiting for cache purge to propagate (checking every ${checkInterval/1000}s, max ${maxWaitTime/1000}s)...`)
        
        const { getCacheStatus } = await import("@netlify/cache")
        let freshContent = null
        let checks = 0
        
        // Poll until we get a cache miss or timeout
        while (checks < maxChecks && !freshContent) {
          checks++
          const elapsed = checks * checkInterval
          console.log(`   Check ${checks}/${maxChecks} (${elapsed/1000}s elapsed)...`)
          
          // Use cache-busting headers and query param to force cache miss
          const bypassUrl = `${siteUrl}${body.path}?_bypass=${Date.now()}`
          const response = await fetch(bypassUrl, {
            method: "GET",
            headers: {
              "User-Agent": "Netlify-Revalidate/1.0",
              "X-Revalidate": "true",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
            },
          })
          
          const status = response.status
          const text = await response.text()
          const cacheInfo = getCacheStatus(response)
          const cacheStatus = cacheInfo.hit ? "hit" : (cacheInfo.caches?.edge?.stale ? "stale" : "miss")
          
          console.log(`      Status: ${status}, Cache: ${cacheStatus}, Edge: ${cacheInfo.caches?.edge?.hit ? 'hit' : 'miss'}`)
          
          // If we got a cache miss, we have fresh content
          if (!cacheInfo.hit && status === 200 && text.length > 0) {
            freshContent = text
            console.log(`✅ Fresh content received after ${elapsed/1000}s (cache miss)`)
            break
          }
          
          // Wait before next check (unless this was the last one)
          if (checks < maxChecks) {
            await new Promise(resolve => setTimeout(resolve, checkInterval))
          }
        }
        
        if (!freshContent) {
          console.warn(`⚠️ Could not get fresh content after ${maxWaitTime/1000}s - cache may not be fully purged`)
        } else {
          // Now cache the fresh content on the base path
          // First, make a request WITH cache-busting to ensure we get fresh content (not old cache)
          await new Promise(resolve => setTimeout(resolve, 2000))
          console.log(`🔄 Requesting base path with cache-busting to get fresh content...`)
          
          const bypassResponse = await fetch(`${siteUrl}${body.path}?_bypass=${Date.now()}`, {
            method: "GET",
            headers: {
              "User-Agent": "Netlify-Revalidate/1.0",
              "X-Revalidate": "true",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
            },
          })
          
          const bypassCacheInfo = getCacheStatus(bypassResponse)
          const bypassText = await bypassResponse.text()
          console.log(`   Bypass request: ${bypassResponse.status} (${bypassText.length} bytes, cache: ${bypassCacheInfo.hit ? 'hit' : 'miss'})`)
          
          // Now make a request WITHOUT cache-busting to cache the fresh content on the base path
          // We need to wait for the purge to fully propagate, so we'll retry until we get a cache miss
          console.log(`🔄 Caching fresh content on base path (no query params)...`)
          
          let basePathCached = false
          let cacheAttempts = 0
          const maxCacheAttempts = 10 // Try up to 10 times
          
          while (!basePathCached && cacheAttempts < maxCacheAttempts) {
            cacheAttempts++
            
            // Wait progressively longer between attempts (5s, 10s, 15s, etc.)
            if (cacheAttempts > 1) {
              const waitTime = cacheAttempts * 5000 // 5s, 10s, 15s, etc.
              console.log(`   Attempt ${cacheAttempts}/${maxCacheAttempts}: Waiting ${waitTime/1000}s for purge to propagate...`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
            } else {
              // First attempt: wait 5 seconds
              await new Promise(resolve => setTimeout(resolve, 5000))
            }
            
            console.log(`   Attempt ${cacheAttempts}/${maxCacheAttempts}: Requesting base path...`)
            
            const cacheResponse = await fetch(`${siteUrl}${body.path}`, {
              method: "GET",
              headers: {
                "User-Agent": "Netlify-Revalidate/1.0",
                "X-Revalidate": "true",
                // No cache-busting headers - we want this to be cached
              },
            })
            
            const cacheInfo2 = getCacheStatus(cacheResponse)
            const cacheText = await cacheResponse.text()
            const cacheStatus = cacheInfo2.hit ? "hit" : "miss"
            
            console.log(`      Status: ${cacheResponse.status}, Cache: ${cacheStatus}, Edge: ${cacheInfo2.caches?.edge?.hit ? 'hit' : 'miss'}, ${cacheText.length} bytes`)
            
            // If we got a cache miss, we successfully cached fresh content
            if (!cacheInfo2.hit && cacheResponse.status === 200 && cacheText.length > 0) {
              basePathCached = true
              console.log(`✅ Base path cached with fresh content after ${cacheAttempts} attempt(s)`)
              break
            }
            
            // If still cached, we'll retry
            if (cacheAttempts < maxCacheAttempts) {
              console.log(`   ⏳ Still cached, will retry...`)
            }
          }
          
          if (!basePathCached) {
            console.warn(`⚠️ Could not cache fresh content on base path after ${maxCacheAttempts} attempts - purge may need more time to propagate`)
          }
        }
      } catch (regenError) {
        // Non-critical - regeneration will happen on next natural request
        console.warn("⚠️ Could not trigger regeneration:", regenError)
      }
    }

    // Return 202 Accepted - purge and regeneration complete
    setResponseStatus(event, 202)
    return {
      message: "Cache purged and page regenerated successfully",
      tag: body.tag,
      path: body.path || "not specified",
      note: "The page has been regenerated and cached. You can reload to see the new content.",
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
