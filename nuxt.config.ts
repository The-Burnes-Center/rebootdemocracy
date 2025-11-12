// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,
  },
  routeRules: {
    // Homepage - prerender
    "/": { prerender: true },
    // ISR test page - using explicit cache headers to ensure proper behavior
    "/test-isr": {
      isr: true,
      headers: {
        // Explicit cache headers to ensure CDN caching and allow revalidation
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, stale-while-revalidate=31536000, durable",
      },
    },
  },
  // Nitro preset is configured in nitro.config.ts (following Answer Overflow example)
});

