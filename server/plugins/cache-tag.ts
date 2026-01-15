/**
 * Nitro Plugin: Set Netlify-Cache-Tag Header for ISR Pages
 * 
 * This plugin sets the dynamic Netlify-Cache-Tag header for ISR pages using Nitro hooks.
 * 
 * IMPORTANT: This plugin runs at RUNTIME (when requests come in), NOT during build.
 * - ISR pages are NOT pre-rendered during build
 * - Plugin runs when a user requests a page (first request triggers SSR)
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
 * route rules in nuxt.config.ts, so we only set the dynamic tag here.
 * 
 * Usage:
 * - Home page (/): tag format is "home"
 * - Blog listing page (/blog): tag format is "blog"
 * - Blog posts (/blog/{slug}): tag format is "blog/{slug}" (e.g., "blog/my-post-slug")
 * - Weekly news listing (/newsthatcaughtoureye): tag format is "weekly-news"
 * - Weekly news edition (/newsthatcaughtoureye/{edition|latest}): tag format is "weekly-news/{edition|latest}"
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
      
      // Remove query parameters for path matching
      const urlWithoutQuery = url.split('?')[0]
      const pathParts = urlWithoutQuery.split('/').filter(Boolean)
      
      let cacheTag: string | null = null
      
      // Home page: /
      if (urlWithoutQuery === "/" || urlWithoutQuery === "") {
        cacheTag = "home"
        console.log(`🔍 Cache tag plugin - request hook triggered for home page: ${url}`)
      }
      // Blog listing page: /blog
      else if (urlWithoutQuery === "/blog") {
        cacheTag = "blog"
        console.log(`🔍 Cache tag plugin - request hook triggered for blog listing: ${url}`)
      }
      // Blog post: /blog/{slug}
      else if (urlWithoutQuery.startsWith("/blog/")) {
        if (pathParts.length >= 2 && pathParts[0] === 'blog') {
          const slug = pathParts[1]
          cacheTag = `blog/${slug}`
          console.log(`🔍 Cache tag plugin - request hook triggered for blog post: ${url}`)
        } else {
          console.warn(`⚠️ Cache tag plugin - Could not extract slug from URL: ${url}, pathParts: ${JSON.stringify(pathParts)}`)
        }
      }
      // Weekly news listing page: /newsthatcaughtoureye
      else if (urlWithoutQuery === "/newsthatcaughtoureye") {
        cacheTag = "weekly-news"
        console.log(`🔍 Cache tag plugin - request hook triggered for weekly news listing: ${url}`)
      }
      // Weekly news edition page: /newsthatcaughtoureye/{edition|latest}
      else if (urlWithoutQuery.startsWith("/newsthatcaughtoureye/")) {
        if (pathParts.length >= 2 && pathParts[0] === "newsthatcaughtoureye") {
          const edition = pathParts[1]
          cacheTag = `weekly-news/${edition}`
          console.log(`🔍 Cache tag plugin - request hook triggered for weekly news edition: ${url}`)
        } else {
          console.warn(`⚠️ Cache tag plugin - Could not extract weekly news slug from URL: ${url}, pathParts: ${JSON.stringify(pathParts)}`)
        }
      }
      
      // Set the cache tag header if we determined one
      if (cacheTag) {
        // Set the header using Nuxt's helper
        setResponseHeader(event, "Netlify-Cache-Tag", cacheTag)
        
        // Also set directly on node response as backup
        if (event.node?.res && !event.node.res.headersSent) {
          event.node.res.setHeader("Netlify-Cache-Tag", cacheTag)
        }
        
        console.log(`🏷️ ✅ Set cache tag: ${cacheTag} (URL: ${url})`)
      }
    } catch (e) {
      // Non-critical - if cache tag setting fails, the page still works
      // Cache tags are optional, but required for on-demand revalidation
      console.warn("❌ Could not set cache tag:", e)
    }
  })
})

