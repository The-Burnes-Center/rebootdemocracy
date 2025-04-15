import { defineNuxtConfig } from "nuxt/config";
import '@nuxtjs/algolia'; 

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,
  
  modules: [
    '@nuxt/test-utils/module',
    '@nuxtjs/algolia'
  ],
  nitro: {
    output: {
      dir: '.output',
      serverDir: '.output/server',
      publicDir: '.output/public'
    }
  },
  algolia: {
    apiKey: process.env.ALGOLIA_API_KEY,
    applicationId: process.env.ALGOLIA_APP_ID,
    lite: true,
    instantSearch: {
      theme: 'satellite',
    },
  },
  routeRules: {
    '/': { prerender: true },
  },
  css: [
    './components/styles/index.css',
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
      title: 'Reboot Democracy',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge,chrome=1' }
      ],
      link: [
        { rel: 'shortcut icon', type: 'image/png', href: '/innovateus_favicon.001.png' },
        {
          rel: 'stylesheet',
          href: 'https://kit.fontawesome.com/59ddbfe387.css',
          crossorigin: 'anonymous'
        },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'
        }
      ]
    }
  }
});
