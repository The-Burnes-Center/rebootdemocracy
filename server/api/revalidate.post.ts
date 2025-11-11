import { purgeCache } from "@netlify/functions"

/**
 * Check Cache-Status header to determine cache state
 * Returns: 'miss' | 'hit' | 'stale' | 'unknown'
 */
function getCacheStatus(response: Response): string {
  const cacheStatus = response.headers.get("Cache-Status")
  if (!cacheStatus) return "unknown"
  
  // Parse Cache-Status header (format: "Netlify Edge"; hit or "Netlify Edge"; fwd=miss)
  if (cacheStatus.includes("hit")) return "hit"
  if (cacheStatus.includes("fwd=stale")) return "stale"
  if (cacheStatus.includes("fwd=miss") || cacheStatus.includes("miss")) return "miss"
  
  return "unknown"
}

/**
 * Poll a URL until it's cached, checking Cache-Status header
 * Returns when cache status is 'hit' or max attempts reached
 */
async function waitForCache(
  url: string,
  maxAttempts: number = 15,
  delayMs: number = 800
): Promise<{ cached: boolean; attempts: number; finalStatus: string }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      
      const cacheStatus = getCacheStatus(response)
      console.log(`Cache check attempt ${attempt}/${maxAttempts}: ${cacheStatus}`)
      
      if (cacheStatus === "hit") {
        return { cached: true, attempts, finalStatus: cacheStatus }
      }
      
      // If not cached yet, wait before next attempt
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.warn(`Cache check attempt ${attempt} failed:`, error)
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  
  return { cached: false, attempts: maxAttempts, finalStatus: "timeout" }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.tag && !body.path) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing tag or path parameter",
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
        path: body.path,
        note: "Set NETLIFY_AUTH_TOKEN in Netlify environment variables for actual cache purging",
      }
    }

    // Import purgeCache dynamically to avoid issues if package is not available
    let purgeCache
    try {
      const netlifyFunctions = await import("@netlify/functions")
      purgeCache = netlifyFunctions.purgeCache
    } catch (importError) {
      console.error("Failed to import @netlify/functions:", importError)
      throw createError({
        statusCode: 500,
        statusMessage: "Cache purge service unavailable",
      })
    }

    const purgeResults: { tag?: boolean; path?: boolean } = {}

    // Purge cache by tag if provided
    if (body.tag) {
      try {
        console.log(`🔄 Purging cache for tag: ${body.tag}`)
        const purgePromise = purgeCache({ tags: [body.tag] })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Cache purge timeout")), 10000)
        )

        await Promise.race([purgePromise, timeoutPromise])
        console.log(`✅ Cache purged successfully for tag: ${body.tag}`)
        purgeResults.tag = true
      } catch (purgeError) {
        const errorMsg =
          purgeError instanceof Error
            ? purgeError.message
            : String(purgeError)
        console.error(`❌ purgeCache error for tag ${body.tag}:`, errorMsg)

        if (errorMsg.includes("token") || errorMsg.includes("auth")) {
          throw createError({
            statusCode: 401,
            statusMessage:
              "NETLIFY_AUTH_TOKEN invalid. Please check your Netlify environment variables.",
          })
        }
        
        if (errorMsg.includes("rate limit") || errorMsg.includes("429") || errorMsg.includes("too many")) {
          console.warn("⚠️ Rate limit hit for tag purge - cache purge may be throttled")
          purgeResults.tag = false
        } else {
          throw purgeError
        }
      }
    }

    // Purge cache by path if provided
    if (body.path) {
      try {
        console.log(`🔄 Purging cache for path: ${body.path}`)
        const purgePromise = purgeCache({ paths: [body.path] })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Cache purge timeout")), 10000)
        )

        await Promise.race([purgePromise, timeoutPromise])
        console.log(`✅ Cache purged successfully for path: ${body.path}`)
        purgeResults.path = true
      } catch (purgeError) {
        const errorMsg =
          purgeError instanceof Error
            ? purgeError.message
            : String(purgeError)
        console.error(`❌ purgeCache path error for ${body.path}:`, errorMsg)
        
        if (errorMsg.includes("rate limit") || errorMsg.includes("429") || errorMsg.includes("too many")) {
          console.warn("⚠️ Rate limit hit for path purge - continuing anyway")
          purgeResults.path = false
        } else {
          purgeResults.path = false
        }
      }
    }

    // Trigger regeneration and wait for it to be cached
    let regenerationResult: { cached: boolean; attempts: number; finalStatus: string } | null = null
    
    if (body.path) {
      try {
        const host = event.headers.get("host") || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        const basePath = `${siteUrl}${body.path}`
        
        console.log(`🔄 Triggering regeneration for: ${basePath}`)
        
        // Make a request to trigger regeneration (with cache-busting query param)
        const regenerateUrl = `${basePath}?_regen=${Date.now()}`
        const regenerateResponse = await fetch(regenerateUrl, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          },
        })
        
        const regenerateStatus = regenerateResponse.status
        console.log(`✅ Regeneration triggered: ${regenerateStatus}`)
        
        // Wait for the base path to be cached (check Cache-Status header)
        console.log(`⏳ Waiting for base path to be cached (checking Cache-Status header)...`)
        regenerationResult = await waitForCache(basePath, 15, 800)
        
        if (regenerationResult.cached) {
          console.log(`✅ Base path is now cached after ${regenerationResult.attempts} attempts`)
        } else {
          console.warn(`⚠️ Base path not cached after ${regenerationResult.attempts} attempts (status: ${regenerationResult.finalStatus})`)
        }
      } catch (regenerateError) {
        console.warn("Regeneration error (non-blocking):", regenerateError)
      }
    }

    setResponseStatus(event, 202)
    return {
      message: "Cache purge and regeneration completed",
      purge: purgeResults,
      regeneration: regenerationResult
        ? {
            cached: regenerationResult.cached,
            attempts: regenerationResult.attempts,
            status: regenerationResult.finalStatus,
          }
        : null,
      tag: body.tag,
      path: body.path,
    }
  } catch (error) {
    console.error("Revalidation error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    
    const statusCode = errorMessage.includes("Missing") ? 400 : 500
    
    throw createError({
      statusCode,
      statusMessage: `Cache purge failed: ${errorMessage}`,
    })
  }
})
