/**
 * Nuxt Configuration for ISR (Incremental Static Regeneration) on Netlify
 * 
 * This configuration enables ISR for specific routes, allowing pages to be:
 * - Generated on-demand (first request triggers SSR)
 * - Cached on Netlify's CDN with durable cache (shared across all edge nodes)
 * - Revalidated on-demand via cache purge API
 * 
 * Key Components:
 * - routeRules: Defines which routes use ISR and their cache behavior
 * - isr: true: Enables ISR for the route (never considers cache stale)
 * - durable directive: Stores cache in shared durable cache across all edge nodes
 * 
 * References:
 * - Netlify Durable Cache: https://docs.netlify.com/build/caching/caching-overview/#durable-directive
 * - Nuxt Route Rules: https://nuxt.com/docs/guide/concepts/rendering#route-rules
 */
export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,
  },
  routeRules: {
    /**
     * Homepage - Prerendered at build time
     * This page is statically generated during build and served as a static file
     */
    "/": { prerender: true },
    
    /**
     * ISR Test Page - Incremental Static Regeneration with Durable Cache
     * 
     * How it works:
     * 1. First request: Page is rendered on-demand by serverless function
     * 2. Response is cached: Stored in Netlify's durable cache (shared across all edge nodes)
     * 3. Subsequent requests: Served from durable cache (no function invocation)
     * 4. On-demand revalidation: Cache can be purged via /api/revalidate endpoint
     * 5. After purge: Next request triggers regeneration and re-caching
     * 
     * Cache Headers Explained:
     * - Cache-Control: "public, max-age=0, must-revalidate"
     *   → Tells browsers to always revalidate (but CDN uses Netlify-CDN-Cache-Control)
     * 
     * - Netlify-CDN-Cache-Control: "public, durable, max-age=31536000, stale-while-revalidate=31536000"
     *   → "durable": Stores in shared cache across all edge nodes (not just local edge cache)
     *   → "max-age=31536000": Cache is considered fresh for 1 year (effectively forever)
     *   → "stale-while-revalidate=31536000": Serve stale content while revalidating in background
     * 
     * Why durable directive?
     * - Without durable: Each edge node has its own cache, purge might not propagate to all nodes
     * - With durable: Shared cache across all nodes, purge invalidates the shared cache reliably
     */
    "/test-isr": {
      isr: true, // Enable ISR (never considers cache stale)
      headers: {
        // Browser cache control (browsers will revalidate, but CDN uses Netlify-CDN-Cache-Control)
        "Cache-Control": "public, max-age=0, must-revalidate",
        
        // Netlify CDN cache control with durable directive
        // This is the key header that enables shared durable cache across all edge nodes
        "Netlify-CDN-Cache-Control": "public, durable, max-age=31536000, stale-while-revalidate=31536000",
      },
    },
    
    /**
     * Blog Posts - Incremental Static Regeneration with Durable Cache
     * 
     * Applies ISR configuration to all blog post routes (/blog/**).
     * Each blog post is cached individually and can be revalidated on-demand
     * by purging the cache tag "blog/{slug}".
     * 
     * How it works:
     * 1. First request: Page is rendered on-demand by serverless function
     * 2. Response is cached: Stored in Netlify's durable cache with tag "blog/{slug}"
     * 3. Subsequent requests: Served from durable cache (no function invocation)
     * 4. On-demand revalidation: Cache can be purged via /api/revalidate endpoint with tag "blog/{slug}"
     * 5. After purge: Next request triggers regeneration and re-caching
     * 
     * Cache Tag Format:
     * - Tag: "blog/{slug}" (e.g., "blog/my-post-slug")
     * - Path: "/blog/{slug}" (e.g., "/blog/my-post-slug")
     * - Set automatically by server/plugins/cache-tag.ts
     * 
     * Directus Webhook:
     * - Send: { "tag": "blog/{slug}" } to /api/revalidate
     * - The endpoint will automatically construct the path "/blog/{slug}" from the tag
     */
    "/blog/**": {
      isr: true, // Enable ISR (never considers cache stale)
      headers: {
        // Browser cache control (browsers will revalidate, but CDN uses Netlify-CDN-Cache-Control)
        "Cache-Control": "public, max-age=0, must-revalidate",
        
        // Netlify CDN cache control with durable directive
        // This is the key header that enables shared durable cache across all edge nodes
        "Netlify-CDN-Cache-Control": "public, durable, max-age=31536000, stale-while-revalidate=31536000",
      },
    },
  },
  // Nitro preset is configured in nitro.config.ts
});

