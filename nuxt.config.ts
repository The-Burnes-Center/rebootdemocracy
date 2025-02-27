// nuxt.config.ts
import fs from 'fs'
import path from 'path'
export default defineNuxtConfig({
  ssr: true,




  // Route rules: explicitly mark the homepage and blog routes for prerendering.
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true }
  },
  // vite: {
  //   resolve: {
  //     alias: {
  //       // Note: Make sure that .nuxt/paths.js exists after build
  //       // '#internal/nuxt/paths': resolve(__dirname, '.nuxt/paths.js')
  //     }
  //   }
  // },
  nitro: {
    prerender: {
      // Enable crawling of links on your site.
      crawlLinks: true,
      // You can also add manually-specified routes using the prerender:routes hook.
      // Here we add all published blog post routes by fetching slugs from Directus.
      // This will run during the build and add the necessary routes for pre-rendering.
      // routes: async () => {
      //   try {
      //     const { createDirectus, rest, readItems } = await import('@directus/sdk')
      //     const directus = createDirectus('https://dev.thegovlab.com').with(rest())
      //     const response = await directus.request(
      //       readItems('reboot_democracy_blog', {
      //         filter: { status: { _eq: 'published' } },
      //         fields: ['slug'],
      //         limit: -1
      //       })
      //     )
      //     const data = response.data || response
      //     return Array.isArray(data)
      //       ? data.map((post) => `/blog/${post.slug}`)
      //       : []
      //   } catch (error) {
      //     console.error('Error fetching blog slugs for prerendering:', error)
      //     return []
      //   }
      // }
    }
  },

  // (Optional) If you need to add dynamic routes at runtime, you can use the hook:
  hooks: {
    'prerender:routes': async (ctx) => {
      try {
        let slugToBuild = null
        if (process.env.INCOMING_HOOK_BODY) {
          try {
            const hookPayload = JSON.parse(process.env.INCOMING_HOOK_BODY);
            if (hookPayload.slug) {
              slugToBuild = hookPayload.slug;
            }
          } catch (error) {
            console.error('Error parsing INCOMING_HOOK_BODY:', error);
          }
        }
        // Get the updated slug (if provided) from an environment variable
 

        const { createDirectus, rest, readItems } = await import('@directus/sdk')
        const directus = createDirectus('https://dev.thegovlab.com').with(rest())
        const response = await directus.request(
          readItems('reboot_democracy_blog', {
            filter: { status: { _eq: 'published' } },
            fields: ['slug'],
            limit: -1
          })
        )
        const data = response.data || response

        if (Array.isArray(data)) {
          data.forEach((post) => {
            const route = `/blog/${post.slug}`

            // Compute the expected output file for this slug.
            // Adjust the file path as needed depending on your Nuxt generate settings.
            const normalizedSlug = post.slug.toLowerCase();
            const renderedFilePath = path.resolve(process.cwd(), 'dist', 'blog', normalizedSlug, 'index.html');            const fileExists = fs.existsSync(renderedFilePath);

            /*
              Logic:
              1. If an UPDATED_SLUG is provided:
                   - Force re-render that slug.
                   - For others, if their file exists (from a previous build), skip prerendering.
                   - If a post is new (i.e. no file yet), add it.
              2. If UPDATED_SLUG is not provided (full rebuild mode):
                   - Only add routes that are missing from the dist folder.
            */
            if (slugToBuild) {
              if (post.slug === slugToBuild) {
                ctx.routes.add(route)
                console.log(`Re-rendering updated route: ${route}`)
              } else if (!fileExists) {
                // If the post is new (file doesn't exist), we add it.
                ctx.routes.add(route)
                console.log(`Adding new route: ${route}`)
              } else {
                console.log(`Skipping prerender for route: ${route} (file exists)`)
              }
            } else {
              if (!fileExists) {
                ctx.routes.add(route)
                console.log(`Adding route for prerender: ${route}`)
              } else {
                console.log(`Skipping prerender for route: ${route} (file exists)`)
              }
            }
          })
        }
      } catch (error) {
        console.error('Error in prerender:routes hook:', error)
      }
    }
  },

  // Other module and performance configurations:
  modules: [
    '@nuxt/image',
    '@nuxtjs/google-fonts',
    'nuxt-lazy-hydrate',
    '@nuxtjs/partytown'
  ],

  googleFonts: {
    families: {
      Roboto: true,
      Lato: true
    }
  },

  image: {
    provider: 'ipx',
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    }
  },

  app: {
    head: {
      title: 'My Nuxt Performance Test App',
      meta: [
        { name: 'description', content: 'Testing performance optimizations in Nuxt' }
      ]
    }
  },

  compatibilityDate: '2025-02-25'
})
