// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-13",
  future: {
    compatibilityVersion: 4,
  },
  routeRules: {
    // Homepage - prerender
    "/": { prerender: true },
    // ISR test page - using isr: true as per Answer Overflow example
    "/test-isr": {
      isr: true,
    },
  },
  // Nitro preset is configured in nitro.config.ts (following Answer Overflow example)
});

