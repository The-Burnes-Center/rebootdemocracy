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

    // Purge cache by tag (this invalidates all cached objects with that tag, including all URL variants)
    // According to Netlify docs: "On-demand invalidation across the entire network takes just a few seconds"
    // Rate limit: 2 purges per tag/site per 5 seconds
    // We only purge by tag to avoid hitting rate limits (purging by tag should invalidate all paths with that tag)
    let purgeSuccess = false
    let rateLimited = false
    
    try {
      console.log(`🔄 Purging cache for tag: ${body.tag}`)
      await purgeCache({ tags: [body.tag] })
      console.log(`✅ Cache purged successfully for tag: ${body.tag}`)
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
        
        // Wait for purge to propagate (Netlify says "a few seconds")
        const waitTime = rateLimited ? 6000 : 5000
        console.log(`⏳ Waiting ${waitTime}ms for cache purge to propagate...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        // Regenerate the page - use cache-busting to ensure we get fresh content
        // The purge should have invalidated the cache, but we use cache-busting headers
        // to ensure the request bypasses any remaining cache
        console.log(`🔄 Regenerating page: ${siteUrl}${body.path}`)
        
        const { getCacheStatus } = await import("@netlify/cache")
        
        // Make multiple attempts to get fresh content (not from cache)
        let freshContent = null
        let attempts = 0
        const maxAttempts = 5
        
        while (attempts < maxAttempts && !freshContent) {
          attempts++
          console.log(`🔄 Regeneration attempt ${attempts}/${maxAttempts}`)
          
          // Use cache-busting headers to bypass cache
          const response = await fetch(`${siteUrl}${body.path}`, {
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
          const hasContent = text.length > 0
          
          // Check cache status - we want a MISS, not a HIT
          const cacheInfo = getCacheStatus(response)
          const cacheStatus = cacheInfo.hit ? "hit" : (cacheInfo.caches?.edge?.stale ? "stale" : "miss")
          
          console.log(`   Attempt ${attempts}: ${status} (${text.length} bytes, cache: ${cacheStatus}, edge: ${cacheInfo.caches?.edge?.hit ? 'hit' : 'miss'})`)
          
          // If we got a cache miss, we have fresh content
          if (!cacheInfo.hit && status === 200 && hasContent) {
            freshContent = text
            console.log(`✅ Fresh content received on attempt ${attempts} (cache miss)`)
            break
          }
          
          // Wait before next attempt if we still got cache hit
          if (attempts < maxAttempts) {
            const waitTime = attempts * 1000 // Exponential backoff: 1s, 2s, 3s, 4s
            console.log(`   ⏳ Still cached, waiting ${waitTime}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
        
        if (!freshContent) {
          console.warn("⚠️ Could not get fresh content after multiple attempts - cache may not be fully purged")
        } else {
          // Now make a request without cache-busting to cache the fresh content
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log(`🔄 Caching fresh content on base path...`)
          const cacheResponse = await fetch(`${siteUrl}${body.path}`, {
            method: "GET",
            headers: {
              "User-Agent": "Netlify-Revalidate/1.0",
              "X-Revalidate": "true",
              // No cache-busting headers - we want this to be cached
            },
          })
          const cacheInfo2 = getCacheStatus(cacheResponse)
          console.log(`✅ Base path cached: ${cacheResponse.status} (cache: ${cacheInfo2.hit ? 'hit' : 'miss'})`)
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
