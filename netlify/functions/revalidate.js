import { purgeCache } from "@netlify/functions"

export default async (req, context) => {
  const url = new URL(req.url)
  const cacheTag = url.searchParams.get("tag")

  if (!cacheTag) {
    return new Response('Missing tag parameter', { status: 400 })
  }

  await purgeCache({
    tags: [cacheTag]
  })

  return new Response('Cache purged', { status: 202 })
}
