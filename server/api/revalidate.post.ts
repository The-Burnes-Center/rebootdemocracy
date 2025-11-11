import { purgeCache } from "@netlify/functions"
import { getCacheStatus } from "@netlify/cache"

/**
 * Poll a URL until it's cached, using Netlify's getCacheStatus utility
 * Returns when cache status shows a hit or max attempts reached
 */
async function waitForCache(
  url: string,
  maxAttempts: number = 15,
  delayMs: number = 800
): Promise<{ cached: boolean; attempts: number; finalStatus: string; cacheInfo?: any }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      
      // Use Netlify's getCacheStatus utility for accurate cache status
      const cacheInfo = getCacheStatus(response)
      const isHit = cacheInfo.hit
      
      console.log(`Cache check attempt ${attempt}/${maxAttempts}: hit=${isHit}, edge=${cacheInfo.caches?.edge?.hit ? 'hit' : 'miss'}, durable=${cacheInfo.caches?.durable?.hit ? 'hit' : 'miss'}`)
      
      if (isHit) {
        return { 
          cached: true, 
          attempts: attempt, 
          finalStatus: "hit",
          cacheInfo 
        }
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
  
  return { 
    cached: false, 
    attempts: maxAttempts, 
    finalStatus: "timeout",
    cacheInfo: null
  }
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

    // Return 202 Accepted immediately to avoid function timeout
    // Regeneration happens asynchronously in the background
    setResponseStatus(event, 202)
    
    // Start regeneration asynchronously (don't await - fire and forget)
    if (body.path) {
      const host = event.headers.get("host") || "localhost:8888"
      const protocol = event.headers.get("x-forwarded-proto") || "http"
      const siteUrl = `${protocol}://${host}`
      const basePath = `${siteUrl}${body.path}`
      
      // Don't await - let this run in background to avoid timeout
      regenerateAndCache(basePath).catch((error) => {
        console.error("[Background] Regeneration error:", error)
      })
    }
    
    return {
      message: "Cache purged successfully. Regeneration in progress...",
      purge: purgeResults,
      regeneration: {
        status: "in_progress",
        note: "Regeneration is happening in the background. The page will be updated shortly.",
      },
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

/**
 * Regenerate and cache the page (runs asynchronously in background)
 * This function can take up to ~31 seconds, so it's run separately to avoid function timeout
 */
async function regenerateAndCache(basePath: string) {
  try {
    console.log(`🔄 [Background] Triggering regeneration for: ${basePath}`)
    
    // Step 1: Trigger regeneration
    const regenerateUrl = `${basePath}?_regen=${Date.now()}`
    const regenerateResponse = await fetch(regenerateUrl, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    })
    
    await regenerateResponse.text()
    console.log(`✅ [Background] Regeneration complete: ${regenerateResponse.status}`)
    
    // Step 2: Request base path to cache new content
    console.log(`🔄 [Background] Requesting base path to cache new content...`)
    
    // Wait for initial purge propagation
    console.log(`⏳ [Background] Waiting 2 seconds for initial cache purge propagation...`)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    // Retry with exponential backoff: 2s, 3s, 5s, 8s, 13s (total ~31 seconds max)
    const retryDelays = [2000, 3000, 5000, 8000, 13000]
    const maxAttempts = retryDelays.length + 1
    let basePathResponse: Response | null = null
    let freshContentReceived = false
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      basePathResponse = await fetch(basePath, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "X-Netlify-Cache-Bypass": "1",
          "X-Force-Regeneration": String(attempt),
        },
      })
      
      await basePathResponse.text()
      const basePathCacheInfo = getCacheStatus(basePathResponse)
      
      console.log(`[Background] Base path attempt ${attempt}/${maxAttempts}: cache: hit=${basePathCacheInfo.hit}, edge=${basePathCacheInfo.caches?.edge?.hit ? 'hit' : 'miss'}, durable=${basePathCacheInfo.caches?.durable?.hit ? 'hit' : 'miss'}`)
      
      if (!basePathCacheInfo.hit) {
        freshContentReceived = true
        console.log(`✅ [Background] Fresh content received on attempt ${attempt}`)
        break
      }
      
      if (attempt < maxAttempts) {
        const waitTime = retryDelays[attempt - 1]
        console.log(`⚠️ [Background] Still cached, waiting ${waitTime}ms (attempt ${attempt + 1}/${maxAttempts})...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
    
    if (!freshContentReceived) {
      console.warn(`⚠️ [Background] Base path still cached after ${maxAttempts} attempts - purge may need more time`)
    }
    
    // Step 3: Wait for base path to be cached
    console.log(`⏳ [Background] Waiting for base path to be cached...`)
    const regenerationResult = await waitForCache(basePath, 15, 800)
    
    if (regenerationResult.cached) {
      console.log(`✅ [Background] Base path cached after ${regenerationResult.attempts} attempts`)
    } else {
      console.warn(`⚠️ [Background] Base path not cached after ${regenerationResult.attempts} attempts`)
    }
  } catch (error) {
    console.error("[Background] Regeneration error:", error)
  }
}
