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

    // Purge cache by tag if provided
    if (body.tag) {
      try {
        // Add timeout to prevent hanging
        const purgePromise = purgeCache({ tags: [body.tag] })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Cache purge timeout")), 10000)
        )

        await Promise.race([purgePromise, timeoutPromise])
        console.log(`Cache purged for tag: ${body.tag}`)
      } catch (purgeError) {
        const errorMsg =
          purgeError instanceof Error
            ? purgeError.message
            : String(purgeError)
        console.error("purgeCache error:", errorMsg)

        // If it's an auth token error, provide helpful message
        if (errorMsg.includes("token") || errorMsg.includes("auth")) {
          throw createError({
            statusCode: 401,
            statusMessage:
              "NETLIFY_AUTH_TOKEN invalid. Please check your Netlify environment variables.",
          })
        }
        throw purgeError
      }
    }

    // Purge cache by path if provided
    if (body.path) {
      try {
        const purgePromise = purgeCache({ paths: [body.path] })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Cache purge timeout")), 10000)
        )

        await Promise.race([purgePromise, timeoutPromise])
        console.log(`Cache purged for path: ${body.path}`)
      } catch (purgeError) {
        const errorMsg =
          purgeError instanceof Error
            ? purgeError.message
            : String(purgeError)
        console.error("purgeCache path error:", errorMsg)
        // Non-blocking - tag purge might have worked
      }
    }

    // After successful cache purge, trigger regeneration by fetching the base path
    // This ensures the page is regenerated for the base URL (without query params)
    if (body.path) {
      try {
        const host = event.headers.get("host") || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        
        // Use the base path with a unique query param to force regeneration
        // The query param ensures we bypass any edge cache
        const timestamp = Date.now()
        const regenerateUrl = `${siteUrl}${body.path}?_regenerate=${timestamp}`
        
        console.log(`Triggering regeneration for base path: ${regenerateUrl}`)
        
        // Wait a bit for cache purge to fully propagate
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        // Make multiple regeneration requests to ensure it happens
        // Use unique query params each time to bypass cache
        const regenerationPromises = []
        for (let i = 0; i < 3; i++) {
          const uniqueUrl = `${siteUrl}${body.path}?_regenerate=${timestamp}-${i}`
          regenerationPromises.push(
            fetch(uniqueUrl, {
              method: "GET",
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "X-Requested-With": "XMLHttpRequest",
                // Add headers to bypass CDN cache
                "X-Netlify-Cache-Bypass": "1",
                "X-Regeneration-Attempt": String(i + 1),
              },
            }).then(async (response) => {
              const text = await response.text()
              console.log(`Regeneration attempt ${i + 1} completed: ${response.status}, body length: ${text.length}`)
              return response
            }).catch((err) => {
              // Non-blocking - regeneration will happen on next request anyway
              console.warn(`Regeneration attempt ${i + 1} failed (non-blocking):`, err)
            })
          )
          // Delay between attempts to ensure cache purge has propagated
          if (i < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
        
        await Promise.all(regenerationPromises)
        
        // Final request to base path to ensure it's cached with new content
        await new Promise((resolve) => setTimeout(resolve, 500))
        await fetch(`${siteUrl}${body.path}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "X-Requested-With": "XMLHttpRequest",
            "X-Netlify-Cache-Bypass": "1",
          },
        }).catch((err) => {
          console.warn("Final regeneration request failed (non-blocking):", err)
        })
        
        console.log("Regeneration triggered successfully for base path (3 attempts + final)")
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

