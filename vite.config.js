import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';

export default defineConfig({
  plugins: [
    vue(),
    Pages({
      extensions: ['vue'],
    }),
    Layouts(),
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // Generate dynamic routes from Directus
    includedRoutes: async (paths) => {
      const directus = createDirectus('https://content.thegovlab.com').with(rest());

      try {
        const response = await directus.request(
          readItems('reboot_democracy_blog', {
            fields: ['slug'],
            filter: { status: 'published' },
            limit: -1,
          })
        );

        const data = response.data ? response.data : response;

        console.log('Data fetched:', data);

        const slugs = data.map((item) => `/blog/${item.slug}`);
        return [...paths, ...slugs];
      } catch (error) {
        console.error('Error fetching slugs from Directus:', error);
        return paths;
      }
    },
  },
  ssr: {
    noExternal: ['@directus/sdk','@unhead/vue'],
  },
});