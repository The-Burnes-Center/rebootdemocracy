/**
 * Server plugin to set Netlify-Cache-Tag header for ISR pages
 * This allows on-demand cache invalidation by tag
 */
export default defineEventHandler((event) => {
  // Set cache tag for test-isr route
  // Only set if we're in a server context (not during prerendering)
  try {
    // Get URL from event - handle both node and web standard formats
    const url = event.node?.req?.url || event.path || ""
    
    if (
      !import.meta.prerender &&
      (url === "/test-isr" || url.startsWith("/test-isr?"))
    ) {
      setResponseHeader(event, "Netlify-Cache-Tag", "test-isr")
    }
  } catch (e) {
    // Non-critical - cache tag is optional
    console.warn("Could not set cache tag:", e)
  }
})
