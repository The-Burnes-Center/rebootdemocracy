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
 * References:
 * - Netlify Cache Tags: https://docs.netlify.com/build/caching/caching-overview/#cache-tags
 * - Nuxt Server Plugins: https://nuxt.com/docs/guide/directory-structure/server#server-plugins
 */
export default defineEventHandler((event) => {
  try {
    
    // Get URL from event - handle both node and web standard formats
    const url = event.node?.req?.url || event.path || ""
    
    // Only set cache tag if not during prerendering
    if (!import.meta.prerender && url.startsWith("/blog/")) {
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
        
        console.log(`🏷️ Set cache tag for blog post: ${cacheTag}`)
      }
    }
  } catch (e) {
    // Non-critical - if cache tag setting fails, the page still works
    // Cache tags are optional, but required for on-demand revalidation
    console.warn("Could not set cache tag:", e)
  }
})
