/**
 * Nitro Plugin: Set Netlify-Cache-Tag Header for ISR Blog Pages
 * 
 * This plugin sets the dynamic Netlify-Cache-Tag header for blog posts using Nitro hooks.
 * 
 * IMPORTANT: This plugin runs at RUNTIME (when requests come in), NOT during build.
 * - ISR pages are NOT pre-rendered during build
 * - Plugin runs when a user requests a blog page (first request triggers SSR)
 * - Logs appear in Netlify function logs (runtime), not build logs
 * 
 * Why use a Nitro plugin instead of nuxt.config.ts route rules?
 * - The cache tag is dynamic (needs the slug from the URL) - can't be set statically
 * - Route rules in nuxt.config.ts can set static headers, but not dynamic ones based on route params
 * 
 * Why use 'request' hook?
 * - Runs early in the request lifecycle, before rendering
 * - Ensures headers are set on all responses (including cached ISR pages)
 * - Works reliably for both SSR and ISR pages
 * 
 * Note: Cache-Control and Netlify-CDN-Cache-Control headers are set by the
 * "/blog/**" route rule in nuxt.config.ts, so we only set the dynamic tag here.
 * 
 * Usage:
 * - For blog posts: tag format is "blog/{slug}" (e.g., "blog/my-post-slug")
 * - Use the same tag when calling /api/revalidate endpoint
 * 
 * References:
 * - Netlify Cache Tags: https://docs.netlify.com/build/caching/caching-overview/#cache-tags
 * - Nitro Plugins: https://nitro.build/guide/plugins
 */
export default defineNitroPlugin((nitroApp) => {
  // Log plugin initialization (appears in function startup logs)
  console.log('🔧 Cache tag plugin loaded and initialized')
  
  // Use 'request' hook - runs on every request
  // This ensures headers are set before the response is sent
  nitroApp.hooks.hook('request', (event) => {
    try {
      // Get URL from event
      const url = event.path || event.node?.req?.url || ""
      
      // Debug: Log all blog requests to verify plugin is running
      if (url && url.includes("/blog/")) {
        console.log(`🔍 Cache tag plugin - request hook triggered for: ${url}`)
      }
      
      // Check if this is a blog route
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
})

