import { defineNuxtConfig } from "nuxt/config";
import '@nuxtjs/algolia';
import { getStaticBlogRoutes } from './composables/getStaticBlogRoutes';
import { getStaticCategoryRoutes } from './composables/getStaticCategoryRoutes';
import { getStaticNewsRoutes } from './composables/getStaticNewsRoutes';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Helper to get changed blog routes for partial builds
const getChangedBlogRoutesForPartialBuild = (): string[] | null => {
  // Check if we're doing a partial build (via env var or manifest file)
  const isPartialBuild = process.env.PARTIAL_BUILD === 'true';
  
  if (!isPartialBuild) {
    return null; // Full build - return null to use all routes
  }

  // Try to read changed routes from manifest
  // Use Netlify's persistent cache directory (survives between builds)
  // Netlify provides /opt/build/cache which is automatically persisted between builds
  // Fallback to .netlify/cache for local development
  const CACHE_DIR = process.env.NETLIFY_CACHE_DIR || (process.platform === 'linux' ? '/opt/build/cache' : join(process.cwd(), '.netlify', 'cache'));
  const MANIFEST_CACHE_DIR = join(CACHE_DIR, 'rebootdemocracy', 'manifests');
  const changedRoutesFile = join(MANIFEST_CACHE_DIR, 'changed-routes.json');
  
  if (existsSync(changedRoutesFile)) {
    try {
      // Read changed routes directly
      const changedRoutes = JSON.parse(readFileSync(changedRoutesFile, 'utf-8'));
      return changedRoutes;
    } catch (error) {
      console.warn('Could not read changed routes, falling back to full build:', error);
    }
  }

  return null;
};

export default defineNuxtConfig({
  compatibilityDate: '2024-11-13',
  future: {
    compatibilityVersion: 4,
  },
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
      // Check if we're doing a partial build
      const changedBlogRoutes = getChangedBlogRoutesForPartialBuild();
      
      const isPartialBuild = process.env.PARTIAL_BUILD === 'true';
      
      let blogRoutes: string[];
      let categoryRoutes: string[] = [];
      let newsRoutes: string[] = [];
      
      if (changedBlogRoutes && changedBlogRoutes.length > 0 && isPartialBuild) {
        // Partial build - only prerender changed blog routes
        console.log(`📝 Partial build: Prerendering ${changedBlogRoutes.length} changed blog routes`);
        blogRoutes = changedBlogRoutes;
        // Skip category and news routes in partial builds - they don't need regeneration
        console.log('📝 Partial build: Skipping category and news routes');
        
        // In partial builds, completely override prerender configuration
        // Disable route discovery and explicitly set only the routes we need
        const partialRoutes = [
          ...blogRoutes,
          // Include homepage (may show recent blog posts)
          '/',
          // Only include essential pages that must exist (404, 200)
          '/404.html',
          '/200.html'
        ];
        
        nitroConfig.prerender = {
          crawlLinks: false, // Disable automatic route discovery
          failOnError: false,
          concurrency: 1,
          // Explicitly set ONLY the changed blog route
          // Don't include other routes - they're already in the cache
          routes: partialRoutes,
          // Ignore all routes that weren't explicitly included
          // This prevents routeRules from adding routes we don't want
          ignore: [
            // Ignore all routes except our specific ones
            (route: string) => {
              // Keep our explicit routes
              if (partialRoutes.includes(route)) return false;
              // Ignore everything else
              return true;
            }
          ]
        };
        console.log(`📝 Partial build: Only prerendering ${partialRoutes.length} routes total:`, partialRoutes);
      } else {
        // Full build - prerender all routes
        console.log('📝 Full build: Prerendering all blog routes');
        blogRoutes = await getStaticBlogRoutes();
        categoryRoutes = await getStaticCategoryRoutes();
        newsRoutes = await getStaticNewsRoutes();
      
      nitroConfig.prerender = nitroConfig.prerender ?? {};
      nitroConfig.prerender.routes = [
        ...(nitroConfig.prerender.routes ?? []),
        ...blogRoutes,
        ...categoryRoutes,
        ...newsRoutes
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
  runtimeConfig: {
    // Expose webhook secret to server-side
    directusWebhookSecret: process.env.DIRECTUS_WEBHOOK_SECRET,
    public: {
      // Public runtime config (if needed)
    },
  },
  routeRules: {
    // Homepage - prerender at build time
    '/': { prerender: true },
    // Blog listing - prerender at build time
    '/blog': { prerender: true },
    // Blog posts - Hybrid SSG + ISR approach with cache tags
    // How it works:
    // 1. Initial build: All blog posts are prerendered at build time (SSG) via nitro:config hook - no API calls needed
    // 2. Updates: When content changes, cache is purged → page regenerates on next request via serverless function
    // 3. Regeneration happens via serverless function (Nuxt Nitro), not a full build
    // 4. Only the specific page regenerates, not the entire site
    // 5. Metadata (title, etc.) updates because it's a fresh render from the serverless function
    // 
    // How regeneration works after cache purge:
    // - Pages are prerendered at build time (SSG) - static HTML files (via nitro:config hook)
    // - When cache is purged via webhook, the CDN cache is invalidated
    // - On next request, Netlify serves the page from the serverless function (ISR) because cache is invalidated
    // - The serverless function generates the page with fresh data from Directus
    // - This new page is cached at CDN edge with cache tags
    // - Only that specific page regenerates, metadata updates automatically
    '/blog/**': { 
      isr: true,  // ISR: Allows regeneration via serverless function after cache purge
      // Note: Prerendering at build time is handled by nitro:config hook above
      headers: {
        // Browser should revalidate, but CDN caches with stale-while-revalidate
        'Cache-Control': 'public, max-age=0, must-revalidate',
        // Netlify CDN caches indefinitely but allows revalidation via cache tags
        // When cache is purged via webhook, page regenerates on next request via serverless function
        'Netlify-CDN-Cache-Control': 'public, max-age=31536000, stale-while-revalidate=31536000, durable'
      }
    },
    // Other static pages - prerender at build time
    '/events': { prerender: true },
    '/more-resources': { prerender: true },
    '/newsthatcaughtoureye/**': { prerender: true },
    '/about': { prerender: true },
    '/our-research': { prerender: true },
    '/our-engagements': { prerender: true },
    // News latest - SSR with short cache
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
