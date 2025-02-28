import fs from 'fs'
import path from 'path'

export default defineNuxtConfig({
  hooks: {
    'prerender:routes': async (ctx) => {
      try {
        // Commented out webhook-based mode:
        // let slugToBuild: string | null = null;
        // if (process.env.INCOMING_HOOK_BODY) {
        //   try {
        //     const hookPayload = JSON.parse(process.env.INCOMING_HOOK_BODY);
        //     if (hookPayload.slug) {
        //       slugToBuild = hookPayload.slug;
        //     }
        //   } catch (error) {
        //     console.error('Error parsing INCOMING_HOOK_BODY:', error);
        //   }
        // }

        const { createDirectus, rest, readItems } = await import('@directus/sdk');
        const directus = createDirectus('https://dev.thegovlab.com').with(rest());
        const response = await directus.request(
          readItems('reboot_democracy_blog', {
            filter: { status: { _eq: 'published' } },
            fields: ['slug'],
            limit: -1
          })
        );
        const data = response.data || response;

        if (Array.isArray(data)) {
          data.forEach((post) => {
            const normalizedSlug = post.slug.toLowerCase();
            const route = `/blog/${post.slug}`;

            // Commented out conditional logic that checked for a specific webhook slug:
            // if (slugToBuild) {
            //   if (post.slug === slugToBuild) {
            //     ctx.routes.add(route);
            //     console.log(`Re-rendering updated route: ${route}`);
            //   } else {
            //     console.log(`Skipping route: ${route} (webhook update does not match)`);
            //   }
            // } else {
            //   const renderedFilePath = path.resolve(process.cwd(), 'dist', 'blog', normalizedSlug, 'index.html');
            //   const fileExists = fs.existsSync(renderedFilePath);
            //   if (!fileExists) {
            //     ctx.routes.add(route);
            //     console.log(`Adding route for prerender: ${route}`);
            //   } else {
            //     console.log(`Skipping prerender for route: ${route} (file exists)`);
            //   }
            // }

            // Always add every route:
            ctx.routes.add(route);
            console.log(`Prerendering route: ${route}`);
          });
        }
      } catch (error) {
        console.error('Error in prerender:routes hook:', error);
      }
    }
  },

  // Other module and performance configurations...
});