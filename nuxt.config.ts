// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,
  },
  routeRules: {
    // Homepage - prerender
    "/": { prerender: true },
    // ISR test page - using isr: true as per Netlify docs
    "/test-isr": {
      isr: true,
      headers: {
        // Explicit cache headers to ensure proper caching
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, max-age=31536000, stale-while-revalidate=31536000, durable",
      },
    },
  },
});

