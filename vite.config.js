import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';

// Safely read asset directory and create UUID-to-filename mapping
// Updated to dist/assets
const assetsDir = path.join(process.cwd(), 'dist', 'assets');
const uuidToFileMap = {};

if (!fs.existsSync(assetsDir)) {
  console.warn(`Warning: "dist/assets" does not exist. Skipping asset mapping...`);
} else {
  try {
    const files = fs.readdirSync(assetsDir);
    files.forEach((file) => {
      const [uuid, ...extParts] = file.split('.');
      if (uuid && extParts.length) {
        // Example: 00db1cad-6bc8-4254-8b11-53a383cf0b82.mp3 → { "00db1cad-6bc8-4254-8b11-53a383cf0b82": "00db1cad-6bc8-4254-8b11-53a383cf0b82.mp3" }
        uuidToFileMap[uuid.toLowerCase()] = file;
      }
    });
  } catch (error) {
    console.error('Error loading assets from dist/assets:', error);
  }
}

export default defineConfig({
  base: '',
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    Pages({ extensions: ['vue'] }),
    Layouts(),
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    
    includedRoutes: async (paths) => {
      const distDir = path.join(process.cwd(), 'dist');
      let slugToBuild = process.env.SLUG_TO_BUILD;

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
          const data = response.data || response;

          // Build route => /blog/<slug>
          const routePaths = data.map((item) => `/blog/${item.slug.toLowerCase()}`);

          // If dist/blog/<slug>.html exists, skip building
          const finalRoutes = [];
          for (const route of routePaths) {
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
      // Example rewriting of script/link references to be relative
      const depth = route.split('/').length - 1;
      const assetPrefix = './' + '../'.repeat(depth - 1);

      html = html
        // Make <script src="xxx"> references relative
        .replace(
          /(<script[^>]*\s+src=")(?!https?:\/\/|\/\/|data:)([^"]+)(")/g,
          `$1${assetPrefix}$2$3`
        )
        // Make <link href="xxx"> references relative
        .replace(
          /(<link[^>]*\s+href=")(?!https?:\/\/|\/\/|data:)([^"]+)(")/g,
          `$1${assetPrefix}$2$3`
        )
        // Rewrite directus asset URLs if local file exists in dist/assets
        .replace(
          /https:\/\/content\.thegovlab\.com\/assets\/([a-f0-9-]+)/gi,
          (match, uuid) => {
            const filename = uuidToFileMap[uuid.toLowerCase()];
            return filename
              ? `${assetPrefix}assets/${filename}`
              : match;
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