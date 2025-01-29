import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';

// Safely read asset directory and create UUID-to-filename mapping
const assetsDir = path.join(process.cwd(), 'public', 'assets');
const uuidToFileMap = {};

if (!fs.existsSync(assetsDir)) {
  console.warn(`Warning: "public/assets" does not exist. Skipping asset mapping...`);
} else {
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

      // If we have an incoming hook with a slug
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
        // Otherwise, fetch all published slugs from Directus, and skip those already in dist
        const directus = createDirectus('https://content.thegovlab.com').with(rest());
        try {
          const response = await directus.request(
            readItems('reboot_democracy_blog', {
              fields: ['slug'],
              filter: { status: 'published' },
              limit: -1,
            })
          );
          // Handle either response.data or direct response
          const data = response.data ? response.data : response;

          // Build route => /blog/<slug>
          const routePaths = data.map((item) => `/blog/${item.slug.toLowerCase()}`);

          const finalRoutes = [];
          for (const route of routePaths) {
            const slugName = route.replace(/^\/blog\//, '');
            // The final .html is dist/blog/<slug>.html
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
      // If you need to adjust references to scripts or assets, do it here
      // Example of rewriting references to directus assets if we have a matching local file
      const depth = route.split('/').length - 1;
      const assetPrefix = './' + '../'.repeat(depth - 1);

      html = html
        // Make script src references relative
        .replace(
          /(<script[^>]*\s+src=")(?!https?:\/\/|\/\/|data:)([^"]+)(")/g,
          `$1${assetPrefix}$2$3`
        )
        // Make link href references relative
        .replace(
          /(<link[^>]*\s+href=")(?!https?:\/\/|\/\/|data:)([^"]+)(")/g,
          `$1${assetPrefix}$2$3`
        )
        // Rewrite directus asset URLs to local if we have a match
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
    // Example array of modules that must not be bundled externally
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