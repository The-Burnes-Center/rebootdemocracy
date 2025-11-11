import { purgeCache } from "@netlify/functions"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.tag) {
      throw createError({ statusCode: 400, statusMessage: "Missing tag parameter" })
    }

    // Check if NETLIFY_AUTH_TOKEN is available (required for purgeCache)
    const authToken = process.env.NETLIFY_AUTH_TOKEN
    if (!authToken) {
      console.warn("NETLIFY_AUTH_TOKEN not found - cache purge may fail")
      // In local development, simulate success
      if (process.env.NODE_ENV === "development") {
        return { message: "Cache purge simulated (local dev)", tag: body.tag }
      }
    }

    await purgeCache({ tags: [body.tag] })

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

