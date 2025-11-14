/**
 * Server Plugin: Set Netlify-Cache-Tag and Cache-Control Headers for ISR Pages
 * 
 * This plugin runs on every server request and sets the necessary headers
 * for ISR pages to enable durable caching and tag-based invalidation.
 * 
 * How it works:
 * 1. Runs on every server request (server plugin)
 * 2. Checks if the request is for an ISR route (e.g., /test-isr, /blog/slug)
 * 3. Sets Netlify-Cache-Tag header with a unique tag (e.g., "test-isr", "blog/slug")
 * 4. Sets Netlify-CDN-Cache-Control header with durable directive for shared cache
 * 5. When cache is purged by this tag, all pages with this tag are invalidated
 * 
 * Why use a plugin instead of setting in the page component?
 * - Server plugins run before page rendering, avoiding SSR context issues
 * - Centralized logic - easier to manage cache tags for multiple routes
 * - Works reliably during SSR without needing to check for Nuxt context availability
 * - Ensures headers are set even if route rules don't apply to dynamic routes
 * 
 * Usage:
 * - Add routes to the condition below to tag them for cache invalidation
 * - Use the same tag when calling /api/revalidate endpoint
 * - For blog posts: tag format is "blog/{slug}" (e.g., "blog/my-post-slug")
 * 
 * References:
 * - Netlify Cache Tags: https://docs.netlify.com/build/caching/caching-overview/#cache-tags
 * - Netlify Durable Cache: https://docs.netlify.com/build/caching/caching-overview/#durable-directive
 * - Nuxt Server Plugins: https://nuxt.com/docs/guide/directory-structure/server#server-plugins
 */
export default defineEventHandler((event) => {
  try {
    // Get URL from event - handle both node and web standard formats
    // event.node?.req?.url: Node.js request format
    // event.path: Web standard format
    const url = event.node?.req?.url || event.path || ""
    
    // Only set cache headers if:
    // 1. Not during prerendering (prerendered pages don't need cache headers)
    // 2. Request is for an ISR route
    if (!import.meta.prerender) {
      // Test ISR page: /test-isr
      if (url === "/test-isr" || url.startsWith("/test-isr?")) {
        // Set the cache tag that will be used for on-demand invalidation
        // This tag can be purged via /api/revalidate endpoint
        setResponseHeader(event, "Netlify-Cache-Tag", "test-isr")
        
        // Set durable cache control header for shared cache across all edge nodes
        // This ensures the durable directive is applied even if route rules don't work
        setResponseHeader(
          event,
          "Netlify-CDN-Cache-Control",
          "public, durable, max-age=31536000, stale-while-revalidate=31536000"
        )
        setResponseHeader(event, "Cache-Control", "public, max-age=0, must-revalidate")
      }
      // Blog posts: /blog/{slug}
      else if (url.startsWith("/blog/")) {
        // Extract slug from URL (e.g., /blog/my-post-slug -> my-post-slug)
        // Remove query parameters if present
        const urlWithoutQuery = url.split('?')[0]
        const pathParts = urlWithoutQuery.split('/').filter(Boolean) // ['blog', 'slug']
        
        if (pathParts.length >= 2 && pathParts[0] === 'blog') {
          const slug = pathParts[1]
          // Set cache tag as "blog/{slug}" (e.g., "blog/my-post-slug")
          // This matches the format expected by the revalidate endpoint
          const cacheTag = `blog/${slug}`
          setResponseHeader(event, "Netlify-Cache-Tag", cacheTag)
          
          // Set durable cache control header for shared cache across all edge nodes
          // This is critical for ensuring the durable cache works for dynamic routes
          // The durable directive stores responses in a shared cache across all edge nodes
          setResponseHeader(
            event,
            "Netlify-CDN-Cache-Control",
            "public, durable, max-age=31536000, stale-while-revalidate=31536000"
          )
          setResponseHeader(event, "Cache-Control", "public, max-age=0, must-revalidate")
          
          console.log(`🏷️ Set cache tag and durable headers for blog post: ${cacheTag}`)
        }
      }
    }
  } catch (e) {
    // Non-critical - if cache header setting fails, the page still works
    // Cache headers are optional, but recommended for on-demand revalidation and durable cache
    console.warn("Could not set cache headers:", e)
  }
})
