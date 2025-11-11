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

    // Trigger regeneration and wait for it to be cached
    let regenerationResult: { cached: boolean; attempts: number; finalStatus: string; cacheInfo?: any } | null = null
    
    if (body.path) {
      try {
        const host = event.headers.get("host") || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        const basePath = `${siteUrl}${body.path}`
        
        console.log(`🔄 Triggering regeneration for: ${basePath}`)
        
        // Step 1: Make a request with cache-busting query param to trigger server-side regeneration
        // The fetch() promise resolves when the response is ready, so we know regeneration is complete
        const regenerateUrl = `${basePath}?_regen=${Date.now()}`
        const regenerateResponse = await fetch(regenerateUrl, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          },
        })
        
        // Await the response body to ensure the server has fully generated the new content
        await regenerateResponse.text()
        
        const regenerateStatus = regenerateResponse.status
        console.log(`✅ Regeneration complete: ${regenerateStatus}`)
        
        // Step 2: Make a request to the BASE PATH (no query params) to cache the new content
        // We need to ensure this bypasses cache completely to get fresh content
        // Even though we purged, there might be propagation delay, so we use aggressive cache-busting
        console.log(`🔄 Requesting base path to cache new content...`)
        
        // Make multiple requests with cache-busting to ensure we get fresh content
        // The first request might still hit cache, so we make a few attempts
        let basePathResponse: Response | null = null
        let basePathCacheInfo: any = null
        let freshContentReceived = false
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          basePathResponse = await fetch(basePath, {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "X-Netlify-Cache-Bypass": "1",
              "X-Force-Regeneration": String(attempt),
            },
          })
          
          // Await the response body to ensure the content is fully generated
          await basePathResponse.text()
          
          basePathCacheInfo = getCacheStatus(basePathResponse)
          const basePathStatus = basePathResponse.status
          
          console.log(`Base path request attempt ${attempt}: ${basePathStatus}, cache: hit=${basePathCacheInfo.hit}, edge=${basePathCacheInfo.caches?.edge?.hit ? 'hit' : 'miss'}, durable=${basePathCacheInfo.caches?.durable?.hit ? 'hit' : 'miss'}`)
          
          // If we got a cache miss, we have fresh content
          if (!basePathCacheInfo.hit) {
            freshContentReceived = true
            console.log(`✅ Fresh content received on attempt ${attempt}`)
            break
          }
          
          // If still cached, wait a bit and try again (cache purge propagation delay)
          if (attempt < 3) {
            console.log(`⚠️ Still cached, waiting for purge propagation...`)
            await new Promise((resolve) => setTimeout(resolve, 300))
          }
        }
        
        if (!freshContentReceived && basePathResponse) {
          console.warn(`⚠️ Base path still showing cached content after 3 attempts - may need to wait longer for purge propagation`)
        }
        
        // Step 3: Wait for the base path to be cached (check Cache-Status header)
        // The base path should now be cached with the new content
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
            cacheInfo: regenerationResult.cacheInfo,
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
