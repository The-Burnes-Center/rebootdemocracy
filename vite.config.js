// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify'; // Import the plugin
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';

export default defineConfig({
  base: "", 
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // Add Vuetify plugin with autoImport option
    Pages({
      extensions: ['vue'],
    }),
    Layouts(),
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    includedRoutes: async (paths) => {
      let slugToBuild = process.env.SLUG_TO_BUILD;

      // Check if INCOMING_HOOK_BODY is available
      if (process.env.INCOMING_HOOK_BODY) {
        try {
          const hookPayload = JSON.parse(process.env.INCOMING_HOOK_BODY);
          slugToBuild = hookPayload.slug;
          console.log('Building only for slug:', slugToBuild);
        } catch (error) {
          console.error('Error parsing INCOMING_HOOK_BODY:', error);
        }
      }

      if (slugToBuild) {
        // Only build the specific slug
        return [...paths, `/blog/${slugToBuild}`];
      } else {
        // Existing logic to fetch all slugs
        const directus = createDirectus('https://dev.thegovlab.com').with(rest());

        try {
          const response = await directus.request(
            readItems('reboot_democracy_blog', {
              fields: ['slug'],
              filter: { status: 'published' },
              limit: -1,
            })
          );

          const data = response.data ? response.data : response;
          const slugs = data.map((item) => `/blog/${item.slug}`);
          return [...paths, ...slugs];
        } catch (error) {
          console.error('Error fetching slugs from Directus:', error);
          return paths;
        }
      }
    },
    onPageRendered(route, html) {
      // Determine the depth of the route to adjust asset paths
      const depth = route.split('/').length - 1;
      const assetPrefix = './' + '../'.repeat(depth - 1);

      // Adjust asset paths in the html content
      html = html.replace(
        /(<script .*?src=")(.*?)(".*?>)/g,
        `$1${assetPrefix}$2$3`
      ).replace(
        /(<link .*?href=")(.*?)(".*?>)/g,
        `$1${assetPrefix}$2$3`
      );

      return html;
    },
  },
  ssr: {
    // Include Vuetify in the noExternal option to process its CSS imports
    noExternal: [
      'vuetify',
      '@vuetify/*',
      'vue-router',
      '@vueuse/head',
      '@vueuse/core',
      '@directus/sdk',
      '@unhead/vue',
    ],
  },
});