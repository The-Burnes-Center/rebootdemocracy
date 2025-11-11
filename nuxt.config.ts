export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,
  },
  nitro: {
    preset: "netlify",
    output: {
      dir: ".output",
      publicDir: ".output/public",
    },
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
