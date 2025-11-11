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
    },
  },
})
