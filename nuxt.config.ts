import { defineNuxtConfig } from "nuxt/config";
import '@nuxtjs/algolia'; 


export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,
  
  modules: ['@nuxt/test-utils/module', '@nuxtjs/algolia', 'nuxt-gtag', 'nuxt-build-cache'],
  gtag: {
    id: 'G-L78LX2HS2N',
    enabled: true,
  },
  nitro: {
  preset: 'netlify',
  prerender: {
    crawlLinks: true,
    failOnError: false,
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
    const { createDirectus, rest, readItem } = await import('@directus/sdk');

    let itemIdToBuild: string | null = null;
    let itemAction: string | null = null;
    let itemCollection: string | null = null;

    // 1. Check if this build was triggered by a webhook (incoming hook body)
    if (process.env.INCOMING_HOOK_BODY) {
      console.log('Incoming hook body:', process.env.INCOMING_HOOK_BODY);
      try {
        const hookPayload = JSON.parse(process.env.INCOMING_HOOK_BODY);
        itemIdToBuild = hookPayload.id || null;
        itemAction = hookPayload.action || null;
        itemCollection = hookPayload.collection || null;
      } catch (error) {
        console.error('Error parsing INCOMING_HOOK_BODY:', error);
      }
    }

    nitroConfig.prerender = nitroConfig.prerender ?? {};
    nitroConfig.prerender.routes = nitroConfig.prerender.routes ?? [];

    // 2. If the webhook is for a blog item
    if (itemCollection === 'reboot_democracy_blog' && itemIdToBuild) {
      const directus = createDirectus('https://content.thegovlab.com').with(rest());

      if (itemAction?.includes('delete')) {
        console.log(`[SSG] Skipping route addition: Blog post was deleted (ID: ${itemIdToBuild})`);
        // Deletion: Do not add the deleted route. Netlify will remove stale files automatically
      } else {
        try {
          const post = await directus.request(
            readItem('reboot_democracy_blog', itemIdToBuild, {
              fields: ['slug'],
            })
          );

          if (post?.slug) {
            const route = `/blog/${post.slug}`;
            nitroConfig.prerender.routes.push(route);
            console.log(`[SSG] Adding dynamic route for rebuild: ${route}`);
          } else {
            console.warn(`[SSG] No slug found for blog with ID ${itemIdToBuild}. Skipping.`);
          }
        } catch (error) {
          console.error(`[SSG] Error fetching blog with ID ${itemIdToBuild}:`, error);
        }
      }
    } else {
      const { getStaticBlogRoutes } = await import('./composables/getStaticBlogRoutes');
      const dynamicRoutes = await getStaticBlogRoutes();

      console.log('[SSG] Full rebuild: Pre-rendering all dynamic blog routes:');
      console.log(dynamicRoutes);

      nitroConfig.prerender.routes = [
        ...nitroConfig.prerender.routes,
        ...dynamicRoutes
      ];
    }
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
    '/blog/**': { prerender: true }
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
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge,chrome=1' },
        { name: 'description', content: 'Insights on AI, Governance and Democracy' },
        { name: 'title', content: 'Reboot Democracy' },
        { property: 'og:title', content: 'Reboot Democracy' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://rebootdemocracy.ai' },
        { property: 'og:description', content: 'Insights on AI, Governance and Democracy' },
        { property: 'og:image', content: 'https://content.thegovlab.com/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3' },
        { property: 'twitter:title', content: 'RebootDemocracy.AI' },
        { property: 'twitter:description', content: 'Insights on AI, Governance and Democracy' },
        { property: 'twitter:image', content: 'https://content.thegovlab.com/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3' },
        { property: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [
        { rel: 'shortcut icon', type: 'images/newsheader.png', href: '/images/newsheader.png' },
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
