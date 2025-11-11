import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-13',
  future: {
    compatibilityVersion: 4,
  },
  ssr: true,
  nitro: {
    preset: 'netlify',
    compatibilityDate: '2024-11-13',
    output: {
      dir: '.output',
      publicDir: '.output/public',
    },
  },
  routeRules: {
    // Homepage - prerender
    '/': { prerender: true },
    // ISR test page - following Geist article pattern exactly
    // Headers-only approach (no isr: true needed)
    '/test-isr': {
      headers: {
        'netlify-cache-tag': 'test-isr',
        'cache-control': 'public, max-age=0, must-revalidate',
        'netlify-cdn-cache-control': 'public, max-age=3600, stale-while-revalidate=604800, durable'
      }
    }
  }
})
