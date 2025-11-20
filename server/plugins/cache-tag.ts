/**
 * Server Plugin: Set Netlify-Cache-Tag Header for ISR Blog Pages
 * 
 * This plugin sets the dynamic Netlify-Cache-Tag header for blog posts.
 * 
 * Why use a plugin instead of nuxt.config.ts route rules?
 * - The cache tag is dynamic (needs the slug from the URL) - can't be set statically
 * - Route rules in nuxt.config.ts can set static headers, but not dynamic ones based on route params
 * 
 * Note: Cache-Control and Netlify-CDN-Cache-Control headers are set by the
 * "/blog/**" route rule in nuxt.config.ts, so we only set the dynamic tag here.
 * 
 * Usage:
 * - For blog posts: tag format is "blog/{slug}" (e.g., "blog/my-post-slug")
 * - Use the same tag when calling /api/revalidate endpoint
 * 
 * IMPORTANT: This plugin runs on every request. For ISR pages, it runs when the page
 * is generated on-demand (first request) and the header is included in the cached response.
 * 
 * References:
 * - Netlify Cache Tags: https://docs.netlify.com/build/caching/caching-overview/#cache-tags
 * - Nuxt Server Plugins: https://nuxt.com/docs/guide/directory-structure/server#server-plugins
 */
export default defineEventHandler((event) => {
  try {
    // Get URL from event - try multiple methods to ensure we get the path
    // For ISR pages, event.path should be available
    const url = event.path || event.node?.req?.url || ""
    
    // Debug: Log all blog requests to verify plugin is running
    if (url && url.includes("/blog/")) {
      console.log(`🔍 Cache tag plugin running - URL: ${url}, path: ${event.path}`)
    }
    
    // Check if this is a blog route
    // ISR pages are generated on-demand, not during prerender, so we don't need that check
    if (url && url.startsWith("/blog/")) {
      // Extract slug from URL (e.g., /blog/my-post-slug -> my-post-slug)
      // Remove query parameters if present
      const urlWithoutQuery = url.split('?')[0]
      const pathParts = urlWithoutQuery.split('/').filter(Boolean) // ['blog', 'slug']
      
      if (pathParts.length >= 2 && pathParts[0] === 'blog') {
        const slug = pathParts[1]
        // Set cache tag as "blog/{slug}" (e.g., "blog/my-post-slug")
        // This matches the format expected by the revalidate endpoint
        const cacheTag = `blog/${slug}`
        
        // Set the header using Nuxt's helper
        setResponseHeader(event, "Netlify-Cache-Tag", cacheTag)
        
        // Also set directly on node response as backup
        if (event.node?.res && !event.node.res.headersSent) {
          event.node.res.setHeader("Netlify-Cache-Tag", cacheTag)
        }
        
        console.log(`🏷️ ✅ Set cache tag for blog post: ${cacheTag} (URL: ${url})`)
      } else {
        console.warn(`⚠️ Cache tag plugin - Could not extract slug from URL: ${url}, pathParts: ${JSON.stringify(pathParts)}`)
      }
    }
  } catch (e) {
    // Non-critical - if cache tag setting fails, the page still works
    // Cache tags are optional, but required for on-demand revalidation
    console.warn("❌ Could not set cache tag:", e)
  }
})
