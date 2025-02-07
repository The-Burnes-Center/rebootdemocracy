import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { resolve } from 'path';

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
    // Place these virtual module based plugins first
    Pages({ extensions: ['vue'] }),
    Layouts(),

    // Then the Vue and Vuetify plugins
    vue(),
    vuetify({ autoImport: true }),
  ],
  // Exclude virtual modules from dependency optimization
  optimizeDeps: {
    exclude: ['virtual:generated-pages', 'virtual:generated-layouts'],
  },
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
        } catch (error) {
          console.error('Error parsing INCOMING_HOOK_BODY:', error);
        }
      }

      if (slugToBuild) {
        return [...paths, `/blog/${slugToBuild.toLowerCase()}`];
      }
      
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
        const finalRoutes = [];
        for (const route of routePaths) {
          const slugName = route.replace(/^\/blog\//, '');
          const possibleFile = path.join(distDir, 'blog', `${slugName}.html`);
          if (!fs.existsSync(possibleFile)) {
            finalRoutes.push(route);
          }
        }
        return [...paths, ...finalRoutes];
      } catch (error) {
        console.error('Error fetching slugs from Directus:', error);
        return paths;
      }
    },

    // Ensure blog pages do not get rehydrated after build, but keep OpenAIChat working
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
            /https:\/\/dev\.thegovlab\.com\/assets\/([a-f0-9-]+)(?:\?[^"]*)?/gi,
            (match, uuid) => {
              const filename = uuidToFileMap[uuid.toLowerCase()];
              return filename ? `${assetPrefix}assets/${filename}` : match;
            }
          );
      
        // For blog pages, remove unwanted hydration scripts...
        if (route.startsWith('/blog/')) {
          html = html.replace(/(<script[^>]*?>)([\s\S]*?<\/script>)/gi, () => '');
          
          // ...and then inject the chat island container and chat client script.
          // (Ensure that chat-client.js is placed in your public folder so that it’s served as-is.)
          html = html.replace(
            /<\/body>/i,
            `<div id="chat"></div>
            <script type="module" src="${assetPrefix}assets/chat-client.js"></script>
            <script type="module" src="${assetPrefix}assets/chat-prod.js"></script>
            </body>`
          );          
        }
        return html;
      },
  },

  build: {
    emptyOutDir: false,
    rollupOptions: {
        input: {
            // Default entry (usually index.html in your project)
            main: resolve(__dirname, 'index.html'),
            // Extra entry for your chat client bundle.
            'chat-client': resolve(__dirname, 'src/chat-client.js')
          },
      output: {
        
         entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-prod.js',
        assetFileNames: 'assets/pp-prod.css',
        // Extract the chat component into its own chunk based on its path
        manualChunks(id) {
          if (id.includes('pschat.vue')) {
            return 'chat';
          }
        },
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