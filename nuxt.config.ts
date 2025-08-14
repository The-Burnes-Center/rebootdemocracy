import { defineNuxtConfig } from "nuxt/config";
import '@nuxtjs/algolia';
import { getStaticBlogRoutes } from './composables/getStaticBlogRoutes';
import { getStaticCategoryRoutes } from './composables/getStaticCategoryRoutes';
import { getStaticNewsRoutes } from './composables/getStaticNewsRoutes';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,
  
  modules: ['@nuxt/test-utils/module', '@nuxtjs/algolia', 'nuxt-gtag', 'nuxt-build-cache', 'nuxt-lazy-hydrate'],
  gtag: {
    id: 'G-L78LX2HS2N',
    enabled: true,
  },
  nitro: {
    preset: 'netlify',
    prerender: {
      crawlLinks: false,
      failOnError: false,
      concurrency: 1,
      routes: []
    },
    output: {
      dir: '.output',
      publicDir: '.output/public',
      serverDir: '.output/server'
    }
  },
  hooks: {
    async 'nitro:config'(nitroConfig) {
      const blogRoutes = await getStaticBlogRoutes();
      const categoryRoutes = await getStaticCategoryRoutes();
      const newsRoutes = await getStaticNewsRoutes();
      
      nitroConfig.prerender = nitroConfig.prerender ?? {};
      nitroConfig.prerender.routes = [
        ...(nitroConfig.prerender.routes ?? []),
        ...blogRoutes,
        ...categoryRoutes,
        ...newsRoutes
      ];
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
    '/blog': { prerender: true },
    '/blog/**': { prerender: true },
    '/events': { prerender: true },
    '/more-resources': { prerender: true },
    '/newsthatcaughtoureye/**': { prerender: true },
    '/about': { prerender: true },
    '/our-research': { prerender: true },
    '/our-engagements': { prerender: true },
    '/newsthatcaughtoureye/latest': { 
    prerender: false,  
    headers: { 'cache-control': 's-maxage=60' } 
  },
    '/events/reboot-democracy': {
      redirect: '/events?Reboot%20Democracy%20Lecture%20Series',
      prerender: true
    }
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
      meta: [
        { name: 'description', content: 'RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.' },
        { property: 'og:title', content: 'RebootDemocracy.AI' },
        { property: 'og:description', content: 'RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3?width=1200&height=630&fit=cover&format=jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'RebootDemocracy.AI' },
        { name: 'twitter:description', content: 'RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.' },
        { name: 'twitter:image', content: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3?width=1200&height=630&fit=cover&format=jpg' }
      ],
      link: [
        { rel: 'shortcut icon', type: 'images/newsheader.png', href: '/images/newsheader.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: "anonymous" },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Habibi&family=Lexend:wght@100..900&family=Outfit:wght@100..900&family=Rubik:ital,wght@0,300..900;1,300..900&family=Sora:wght@100..800&display=swap'
        },
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