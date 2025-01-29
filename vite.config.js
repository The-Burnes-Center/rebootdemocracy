import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';

// Read asset directory and create UUID-to-filename mapping
const assetsDir = path.join(process.cwd(), 'public/assets');
const uuidToFileMap = {};

try {
  const files = fs.readdirSync(assetsDir);
  files.forEach((file) => {
    const [uuid, ...extParts] = file.split('.');
    if (uuid && extParts.length) {
      uuidToFileMap[uuid.toLowerCase()] = file;
    }
  });
} catch (error) {
  console.error('Error loading assets:', error);
}

export default defineConfig({
  base: '',
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    Pages({
      extensions: ['vue'],
    }),
    Layouts(),
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    includedRoutes: async (paths) => {
      const distDir = path.join(process.cwd(), 'dist');
      let slugToBuild = process.env.SLUG_TO_BUILD;

      // If we have incoming hook data, try to parse a specific slug
      if (process.env.INCOMING_HOOK_BODY) {
        try {
          const hookPayload = JSON.parse(process.env.INCOMING_HOOK_BODY);
          if (hookPayload.slug) {
            slugToBuild = hookPayload.slug;
          }
          if (slugToBuild) {
            console.log('Building only for slug:', slugToBuild);
          }
        } catch (error) {
          console.error('Error parsing INCOMING_HOOK_BODY:', error);
        }
      }

      // If we have a specific slug to build, do only that
      if (slugToBuild) {
        return [...paths, `/blog/${slugToBuild.toLowerCase()}`];
      } else {
        // Otherwise, fetch all published slugs from Directus, skip ones that already exist in dist
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

          // The route for each item => /blog/<slug>
          const routePaths = data.map((item) => `/blog/${item.slug.toLowerCase()}`);

          const finalRoutes = [];
          for (const route of routePaths) {
            // Our final .html is dist/blog/<slug>.html
            const slugName = route.replace(/^\/blog\//, '');
            const possibleFile = path.join(distDir, 'blog', `${slugName}.html`);

            if (fs.existsSync(possibleFile)) {
              console.log(`Skipping build for "${slugName}", already exists in dist/blog.`);
            } else {
              finalRoutes.push(route);
            }
          }

          return [...paths, ...finalRoutes];
        } catch (error) {
          console.error('Error fetching slugs from Directus:', error);
          return paths;
        }
      }
    },
    onPageRendered(route, html) {
      const depth = route.split('/').length - 1;
      const assetPrefix = './' + '../'.repeat(depth - 1);

      html = html
        .replace(
          /(<script[^>]*\s+src=")(?!https?:\/\/|\/\/|data:)([^"]+)(")/g,
          `$1${assetPrefix}$2$3`
        )
        .replace(
          /(<link[^>]*\s+href=")(?!https?:\/\/|\/\/|data:)([^"]+)(")/g,
          `$1${assetPrefix}$2$3`
        )
        .replace(
          /https:\/\/content\.thegovlab\.com\/assets\/([a-f0-9-]+)/gi,
          (match, uuid) => {
            const filename = uuidToFileMap[uuid.toLowerCase()];
            return filename
              ? `${assetPrefix}assets/${filename}`
              : match; // If no local asset, leave original URL
          }
        );

      return html;
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-prod.js',
        chunkFileNames: 'assets/_slug_-prod.js',
        assetFileNames: 'assets/pp-prod.css',
      },
    },
  },
  ssr: {
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