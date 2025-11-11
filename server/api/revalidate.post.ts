import { purgeCache } from "@netlify/functions"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.tag && !body.path) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing tag or path parameter",
      })
    }

    // Purge cache by tag if provided
    if (body.tag) {
      try {
        await purgeCache({ tags: [body.tag] })
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
            statusCode: 500,
            statusMessage:
              "NETLIFY_AUTH_TOKEN not configured. Please set it in Netlify environment variables.",
          })
        }
        throw purgeError
      }
    }

    // Purge cache by path if provided
    if (body.path) {
      try {
        await purgeCache({ paths: [body.path] })
        console.log(`Cache purged for path: ${body.path}`)
      } catch (purgeError) {
        const errorMsg =
          purgeError instanceof Error
            ? purgeError.message
            : String(purgeError)
        console.error("purgeCache error:", errorMsg)
        // Non-blocking - tag purge might have worked
      }
    }

    setResponseStatus(event, 202)
    return {
      message: "Cache purged successfully",
      tag: body.tag,
      path: body.path,
    }
  } catch (error) {
    console.error("Revalidation error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    throw createError({
      statusCode: 500,
      statusMessage: `Cache purge failed: ${errorMessage}`,
    })
  }
})

