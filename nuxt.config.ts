// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,
  },
  routeRules: {
    // Homepage - prerender
    "/": { prerender: true },
    // ISR test page - using durable directive for shared cache across edge nodes
    // Following Netlify docs: https://docs.netlify.com/build/caching/caching-overview/#durable-directive
    "/test-isr": {
      isr: true,
      headers: {
        // Use durable directive to store in shared cache across all edge nodes
        // This ensures cache is shared and can be invalidated properly
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, durable, max-age=31536000, stale-while-revalidate=31536000",
      },
    },
  },
  // Nitro preset is configured in nitro.config.ts (following Answer Overflow example)
});

