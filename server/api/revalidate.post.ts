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
      // Return success but log that it's simulated
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

    let purgeSucceeded = false

    // Purge cache by tag if provided
    if (body.tag) {
      try {
        console.log(`🔄 Attempting to purge cache for tag: ${body.tag}`)
        // Add timeout to prevent hanging
        const purgePromise = purgeCache({ tags: [body.tag] })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Cache purge timeout")), 10000)
        )

        await Promise.race([purgePromise, timeoutPromise])
        console.log(`✅ Cache purged successfully for tag: ${body.tag}`)
        purgeSucceeded = true
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
        
        // If it's a rate limit error, log but continue
        if (errorMsg.includes("rate limit") || errorMsg.includes("429") || errorMsg.includes("too many")) {
          console.warn("⚠️ Rate limit hit for tag purge - cache purge may be throttled")
          // Don't throw - continue with path purge attempt
        } else {
          throw purgeError
        }
      }
    }

    // Purge cache by path if provided
    if (body.path) {
      try {
        console.log(`🔄 Attempting to purge cache for path: ${body.path}`)
        const purgePromise = purgeCache({ paths: [body.path] })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Cache purge timeout")), 10000)
        )

        await Promise.race([purgePromise, timeoutPromise])
        console.log(`✅ Cache purged successfully for path: ${body.path}`)
        purgeSucceeded = true
      } catch (purgeError) {
        const errorMsg =
          purgeError instanceof Error
            ? purgeError.message
            : String(purgeError)
        console.error(`❌ purgeCache path error for ${body.path}:`, errorMsg)
        
        // If it's a rate limit error, log but continue
        if (errorMsg.includes("rate limit") || errorMsg.includes("429") || errorMsg.includes("too many")) {
          console.warn("⚠️ Rate limit hit for path purge - continuing anyway")
          // Continue - regeneration will still work
        }
        // Non-blocking - tag purge might have worked
      }
    }

    if (!purgeSucceeded && body.tag && body.path) {
      console.warn("⚠️ Cache purge may have failed - but continuing with regeneration attempt")
    }

    // After successful cache purge, trigger regeneration by fetching the base path
    // This ensures the page is regenerated for the base URL (without query params)
    if (body.path) {
      try {
        const host = event.headers.get("host") || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        const basePath = `${siteUrl}${body.path}`
        
        console.log(`Triggering regeneration for base path: ${basePath}`)
        
        // Wait a bit for cache purge to fully propagate
        await new Promise((resolve) => setTimeout(resolve, 1500))
        
        // First, make requests with query params to bypass cache and trigger regeneration
        // These ensure the server generates new content
        for (let i = 0; i < 2; i++) {
          const bypassUrl = `${basePath}?_bypass=${Date.now()}-${i}`
          try {
            const response = await fetch(bypassUrl, {
              method: "GET",
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "X-Requested-With": "XMLHttpRequest",
                "X-Netlify-Cache-Bypass": "1",
              },
            })
            const text = await response.text()
            console.log(`Bypass request ${i + 1} completed: ${response.status}, body length: ${text.length}`)
          } catch (err) {
            console.warn(`Bypass request ${i + 1} failed (non-blocking):`, err)
          }
          // Wait between bypass requests
          if (i < 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
        
        // Wait longer for cache purge to fully propagate across CDN
        console.log("Waiting for cache purge to propagate...")
        await new Promise((resolve) => setTimeout(resolve, 3000))
        
        // Now make requests to BASE PATH with unique query params first to force regeneration
        // Then make final request to base path to cache it
        console.log("Starting base path regeneration with query params...")
        const regenerationNumbers: number[] = []
        
        for (let i = 0; i < 3; i++) {
          try {
            // Use unique query param to force server-side generation
            const uniqueUrl = `${basePath}?_regen=${Date.now()}-${i}`
            console.log(`Base path regeneration attempt ${i + 1} with unique URL...`)
            const response = await fetch(uniqueUrl, {
              method: "GET",
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "X-Requested-With": "XMLHttpRequest",
                "X-Netlify-Cache-Bypass": "1",
              },
            })
            const text = await response.text()
            const numberMatch = text.match(/<code>(\d+)<\/code>/)
            if (numberMatch) {
              const num = parseInt(numberMatch[1])
              regenerationNumbers.push(num)
              console.log(`✅ Regeneration ${i + 1} generated number: ${num}`)
            } else {
              console.warn(`⚠️ Regeneration ${i + 1} - could not extract number`)
            }
          } catch (err) {
            console.warn(`Regeneration attempt ${i + 1} failed (non-blocking):`, err)
          }
          // Wait between regeneration attempts
          if (i < 2) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        }
        
        // Now make final request to base path (no query params) to cache the new content
        // Wait a bit more to ensure the server has the new content ready
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log("Making final request to base path to cache new content...")
        
        try {
          const finalResponse = await fetch(basePath, {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "X-Requested-With": "XMLHttpRequest",
              "X-Netlify-Cache-Bypass": "1",
              "X-Final-Cache-Update": "1",
            },
          })
          const finalText = await finalResponse.text()
          const finalNumberMatch = finalText.match(/<code>(\d+)<\/code>/)
          if (finalNumberMatch) {
            const finalNum = parseInt(finalNumberMatch[1])
            console.log(`✅ Final base path request - number: ${finalNum}`)
            if (regenerationNumbers.length > 0 && finalNum === regenerationNumbers[regenerationNumbers.length - 1]) {
              console.log("✅ Final number matches last regeneration - cache should be updated")
            } else {
              console.warn(`⚠️ Final number (${finalNum}) doesn't match last regeneration (${regenerationNumbers[regenerationNumbers.length - 1]})`)
            }
          }
        } catch (err) {
          console.warn("Final base path request failed (non-blocking):", err)
        }
        
        console.log("Regeneration triggered successfully for base path")
      } catch (regenerateError) {
        // Non-blocking - regeneration will happen on next request
        console.warn("Regeneration trigger error (non-blocking):", regenerateError)
      }
    }

    setResponseStatus(event, 202)
    return {
      message: "Cache purged and regeneration triggered",
      tag: body.tag,
      path: body.path,
    }
  } catch (error) {
    console.error("Revalidation error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    
    // Don't throw 500 for client errors
    const statusCode = errorMessage.includes("Missing") ? 400 : 500
    
    throw createError({
      statusCode,
      statusMessage: `Cache purge failed: ${errorMessage}`,
    })
  }
})

