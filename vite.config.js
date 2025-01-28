// vite.config.js
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
  files.forEach(file => {
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
      let slugToBuild = process.env.SLUG_TO_BUILD;
      
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
        return [...paths, `/blog/${slugToBuild.toLowerCase()}`];
      } else {
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
          const slugs = data.map((item) => `/blog/${item.slug.toLowerCase()}`);
          return [...paths, ...slugs];
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
              : match; // Fallback to original URL if asset not found
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