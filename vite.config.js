import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';

// UPDATED to use dist/assets, since that's where your script writes files
const assetsDir = path.join(process.cwd(), 'dist', 'assets');
const uuidToFileMap = {};

// Load assets map
if (!fs.existsSync(assetsDir)) {
  console.warn(`Warning: "dist/assets" does not exist. Skipping asset mapping...`);
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

      // Build just one slug
      if (slugToBuild) {
        return [...paths, `/blog/${slugToBuild.toLowerCase()}`];
      }

      // Otherwise, build all published slugs from Directus
      const directus = createDirectus('https://dev.thegovlab.com').with(rest());
      try {
        const response = await directus.request(
          readItems('reboot_democracy_blog', {
            fields: ['slug'],
            filter: { status: 'published' },
            limit: -1,
          })
        );

        const data = response.data || response;
        const routePaths = data.map((item) => `/blog/${item.slug.toLowerCase()}`);

        // Skip routes if dist/blog/<slug>.html already exists
        const finalRoutes = [];
        for (const route of routePaths) {
          const slugName = route.replace(/^\/blog\//, '');
          const possibleFile = path.join(distDir, 'blog', `${slugName}.html`);
          if (fs.existsSync(possibleFile)) {
            console.log(`Skipping build for "${slugName}", already in dist/blog.`);
          } else {
            finalRoutes.push(route);
          }
        }

        return [...paths, ...finalRoutes];
      } catch (error) {
        console.error('Error fetching slugs from Directus:', error);
        return paths;
      }
    },

    // Ensure blog pages do not get rehydrated after build
    onPageRendered(route, html) {
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
        // Updated regex: allow optional query params. Ex: ?width=300
        .replace(
          /https:\/\/dev\.thegovlab\.com\/assets\/([a-f0-9-]+)(?:\?[^"]*)?/gi,
          (match, uuid) => {
            const filename = uuidToFileMap[uuid.toLowerCase()];
            return filename
              ? `${assetPrefix}assets/${filename}`
              : match;
          }
        );

      // Prevent hydration for blog pages
      if (route.startsWith('/blog/')) {
        html = html.replace(/<script[^>]*?type="module"[^>]*?>[\s\S]*?<\/script>/gi, '');
      }

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
