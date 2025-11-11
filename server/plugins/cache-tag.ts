export default defineEventHandler((event) => {
  // Set cache tag for test-isr route
  if (event.node.req.url === "/test-isr" || event.node.req.url?.startsWith("/test-isr?")) {
    setResponseHeader(event, "Netlify-Cache-Tag", "test-isr")
  }
})

