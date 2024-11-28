import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePluginRadar } from 'vite-plugin-radar';
import ViteFonts from 'vite-plugin-fonts';
import { format, isPast } from 'date-fns';

import Pages from 'vite-plugin-pages';

import { Directus } from '@directus/sdk';
import { resolve } from 'path';

// Import Vite SSG
import { ViteSSGOptions } from 'vite-ssg';

export default defineConfig({
  base: '/',
  assetsInclude: ['**/*.png'],
  data() {
    return {
      format,
      isPast,
    };
  },
  plugins: [
    vue(),
    VitePluginRadar({
      // Google Analytics tag inject
      enableDev: true,
      analytics: {
        id: 'G-L78LX2HS2N',
      },
    }),
    Pages({
      dirs: 'src/pages',
      extensions: ['vue', 'ts'],
    }),
    ViteFonts({
      typekit: {
        /**
         * Typekit project id
         */
        id: 'tde3xym',

        /**
         * enable non-blocking renderer
         *   <link rel="preload" href="xxx" as="style" onload="this.rel='stylesheet'">
         * default: true
         */
        defer: true,
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    // hmr: {
    //   host: 'localhost', // you could make this an ENV var
    //   port: '3005',
    //   path: '/'
    // }
  },
  // Add ssgOptions for Vite SSG
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    includedRoutes: async (paths) => {
      // Fetch dynamic routes for blog posts
      const directus = new Directus('https://content.thegovlab.com/');
      const { data } = await directus.items('reboot_democracy_blog').readByQuery({
        fields: ['slug'],
        limit: -1,
      });

      const blogRoutes = data.map((post) => `/blog/${post.slug}`);

      // Combine with existing paths
      return [...paths, ...blogRoutes];
    },
  },
  define: {
    __VUE_OPTIONS_API__: true, // or false if not using Options API
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
});