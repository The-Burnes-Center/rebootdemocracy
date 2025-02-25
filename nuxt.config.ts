// nuxt.config.ts
export default defineNuxtConfig({
  // Enable SSR by default
  ssr: true,

  // Define custom route rules to test different rendering modes
  routeRules: {
    '/': { prerender: true }, // Homepage: SSG (static)
    '/products': { swr: true }, // Products: on-demand regeneration (SWR)
    '/blog/**': { isr: true }, // Blog posts: ISR enabled
    '/admin/**': { ssr: false } // Admin: CSR only (client-side only)
  },

  // Modules for performance enhancements
  modules: [
    '@nuxt/image',             // Optimize images with Nuxt Image
    '@nuxtjs/google-fonts',      // Optimize fonts (Nuxt Fonts)
    'nuxt-lazy-hydrate',         // Defer hydration of heavy components
    '@nuxtjs/partytown'             // Offload non-essential JS to web workers
    // Add additional modules as needed (e.g., nuxt-scripts)
  ],

  // Google Fonts configuration (example)
  googleFonts: {
    families: {
      Roboto: true,
      Lato: true
    }
  },

  // Nuxt Image configuration can be customized here if needed
  image: {
    // Example configuration for modern image formats and responsive images
    provider: 'ipx', // or a custom provider (like Cloudinary)
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    }
  },

  // Additional performance optimizations (e.g., head management)
  app: {
    head: {
      title: 'My Nuxt Performance Test App',
      meta: [
        { name: 'description', content: 'Testing performance optimizations in Nuxt' }
      ]
    }
  },

  compatibilityDate: '2025-02-25'
});