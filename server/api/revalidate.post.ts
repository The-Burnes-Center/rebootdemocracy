import { purgeCache } from "@netlify/functions"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.tag) {
    throw createError({ statusCode: 400, statusMessage: "Missing tag parameter" })
  }

  await purgeCache({ tags: [body.tag] })

  setResponseStatus(event, 202)
  return { message: "Cache purged", tag: body.tag }
})

