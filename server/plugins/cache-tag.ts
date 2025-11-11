export default defineEventHandler((event) => {
  // Set cache tag for test-isr route
  // Only set if we're in a server context (not during prerendering)
  if (
    !import.meta.prerender &&
    (event.node.req.url === "/test-isr" ||
      event.node.req.url?.startsWith("/test-isr?"))
  ) {
    try {
      setResponseHeader(event, "Netlify-Cache-Tag", "test-isr")
    } catch (e) {
      // Non-critical - cache tag is optional
      console.warn("Could not set cache tag:", e)
    }
  }
})

