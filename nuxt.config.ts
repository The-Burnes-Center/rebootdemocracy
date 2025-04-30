import { defineNuxtConfig } from "nuxt/config";
import fs from 'fs-extra';
import path from 'path';
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
    async 'prerender:routes'(ctx) {
      const { createDirectus, rest, readItems } = await import('@directus/sdk');
      const directus = createDirectus('https://content.thegovlab.com').with(rest());

      let slugToBuild = null;
      let collection = null;
      let action = null;

      if (process.env.INCOMING_HOOK_BODY) {
        try {
          const payload = JSON.parse(process.env.INCOMING_HOOK_BODY);
          slugToBuild = payload.slug || null;
          collection = payload.collection || null;
          action = payload.action || null;
        } catch (e) {
          console.error('Error parsing webhook payload:', e);
        }
      }

      const response = await directus.request(
        readItems('reboot_democracy_blog', {
          filter: { status: { _eq: 'published' } },
          fields: ['slug'],
          limit: -1
        })
      );

      const posts = response;
      for (const post of posts) {
        const route = `/blog/${post.slug}`;
        const filePath = path.resolve('.output/public', 'blog', post.slug, 'index.html');
        const fileExists = await fs.pathExists(filePath);

        if (slugToBuild) {
          if (post.slug === slugToBuild) {
            ctx.routes.add(route);
            console.log(`[Nitro] Re-rendering updated route: ${route}`);
          } else {
            console.log(`[Nitro] Skipping route: ${route} (does not match updated slug)`);
          }
        } else {
          if (!fileExists) {
            ctx.routes.add(route);
            console.log(`[Nitro] Adding route: ${route}`);
          } else {
            console.log(`[Nitro] Skipping existing route: ${route}`);
          }
        }
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

  css: ['./components/styles/index.css'],

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
