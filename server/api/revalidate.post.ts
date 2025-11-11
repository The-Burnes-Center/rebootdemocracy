import { purgeCache } from "@netlify/functions"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.tag) {
      throw createError({ statusCode: 400, statusMessage: "Missing tag parameter" })
    }

    // purgeCache automatically uses NETLIFY_AUTH_TOKEN from environment
    // If not available, it will fail - check logs for details
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

    setResponseStatus(event, 202)
    return { message: "Cache purged", tag: body.tag }
  } catch (error) {
    console.error("Revalidation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    throw createError({
      statusCode: 500,
      statusMessage: `Cache purge failed: ${errorMessage}`,
    })
  }
})

