import { purgeCache } from "@netlify/functions"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.tag) {
      throw createError({ statusCode: 400, statusMessage: "Missing tag parameter" })
    }

    // purgeCache automatically uses NETLIFY_AUTH_TOKEN from environment
    try {
      await purgeCache({ tags: [body.tag] })
    } catch (purgeError) {
      const errorMsg = purgeError instanceof Error ? purgeError.message : String(purgeError)
      console.error("purgeCache error:", errorMsg)
      
      // If it's an auth token error, provide helpful message
      if (errorMsg.includes("token") || errorMsg.includes("auth")) {
        throw createError({
          statusCode: 500,
          statusMessage: "NETLIFY_AUTH_TOKEN not configured. Please set it in Netlify environment variables.",
        })
      }
      throw purgeError
    }

    // After purging cache, trigger regeneration by fetching the page
    // This ensures the page is regenerated immediately
    if (body.path) {
      try {
        const host = event.headers.get("host") || "localhost:8888"
        const protocol = event.headers.get("x-forwarded-proto") || "http"
        const siteUrl = `${protocol}://${host}`
        
        // Fetch the page to trigger regeneration (with cache-busting)
        const timestamp = Date.now()
        await fetch(`${siteUrl}${body.path}?_revalidate=${timestamp}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            "X-Requested-With": "XMLHttpRequest",
          },
        }).catch((err) => {
          // Non-blocking - regeneration will happen on next request anyway
          console.warn("Regeneration trigger failed (non-blocking):", err)
        })
      } catch (regenerateError) {
        // Non-blocking - regeneration will happen on next request
        console.warn("Regeneration trigger error (non-blocking):", regenerateError)
      }
    }

    setResponseStatus(event, 202)
    return { message: "Cache purged and regeneration triggered", tag: body.tag }
  } catch (error) {
    console.error("Revalidation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    throw createError({
      statusCode: 500,
      statusMessage: `Cache purge failed: ${errorMessage}`,
    })
  }
})

