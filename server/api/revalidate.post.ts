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

    // Purge cache by tag AND by path
    // According to Netlify docs: "On-demand invalidation across the entire network takes just a few seconds"
    // Purging by tag invalidates all cached objects with that tag
    // Purging by path ensures the specific URL is invalidated
    try {
      console.log(`🔄 Purging cache for tag: ${body.tag}`)
      await purgeCache({ tags: [body.tag] })
      console.log(`✅ Cache purged successfully for tag: ${body.tag}`)
      
      // Also purge by path if provided (ensures base path is invalidated)
      if (body.path) {
        console.log(`🔄 Purging cache for path: ${body.path}`)
        await purgeCache({ paths: [body.path] })
        console.log(`✅ Cache purged successfully for path: ${body.path}`)
      }
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
      
      // If it's a rate limit error, provide helpful message
      // Rate limit: 2 purges per tag/site per 5 seconds
      if (errorMsg.includes("rate limit") || errorMsg.includes("429") || errorMsg.includes("too many")) {
        throw createError({
          statusCode: 429,
          statusMessage: "Rate limit exceeded. Each cache tag or site can only be purged twice every 5 seconds.",
        })
      }
      
      throw purgeError
    }

    // After purge, trigger regeneration of the base path to ensure it's updated
    // This ensures the base URL (without query params) gets fresh content
    if (body.path) {
      try {
        const host = event.headers.get("host") || process.env.NETLIFY_SITE_URL || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        
        console.log(`🔄 Triggering regeneration for base path: ${siteUrl}${body.path}`)
        
        // Wait a moment for purge to propagate
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Request the base path to trigger regeneration
        // Use cache-busting headers to ensure we get fresh content
        const response = await fetch(`${siteUrl}${body.path}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "X-Netlify-Cache-Bypass": "1",
          },
        })
        
        const status = response.status
        const text = await response.text()
        console.log(`✅ Regeneration complete: ${status} (${text.length} bytes)`)
      } catch (regenError) {
        // Non-critical - regeneration will happen on next natural request
        console.warn("⚠️ Could not trigger regeneration:", regenError)
      }
    }

    // Return 202 Accepted - purge is complete
    // The next request to the tagged page will hit the server and regenerate
    setResponseStatus(event, 202)
    return {
      message: "Cache purged successfully",
      tag: body.tag,
      path: body.path || "not specified",
      note: "The next request to this page will regenerate and cache new content",
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
