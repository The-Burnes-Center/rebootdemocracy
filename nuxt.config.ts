import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/test-utils/module',
    ['@nuxtjs/algolia', {
      apiKey: process.env.API_KEY,
      appId: process.env.ALGOLIA_APPLICATION_ID,
      lite: true,
    }]
  ],
  ssr: true,
  css: [
    './components/styles/index.css',
    './assets/css/index.css'
  ],
  components: [
    {
      path: './components',
      pathPrefix: false,
      global: true
    }
  ],
  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: "anonymous",
        }
      ]
    }
  }
});