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

function cloneRoute(route) {
  const { parent, ...rest } = route;
  return { ...rest };
}

export default defineConfig({
  base: '',
  plugins: [
    // Place these virtual module based plugins first
    Pages({
      extensions: ['vue'],
      extendRoute(route) {
        // Ensure alias is always an array if it’s defined.
        if (route.alias && !Array.isArray(route.alias)) {
          route.alias = [route.alias];
        }
    
        // For blog-page (from blog-page.vue), add '/blog' as an alias.
        if (route.name === 'blog-page') {
          route.alias = route.alias || [];
          if (!route.alias.includes('/blog')) {
            route.alias.push('/blog');
          }
        }
    
        // For homepage (from index.vue), add '/about' as an alias.
        if (route.name === 'index') {
          route.alias = route.alias || [];
          if (!route.alias.includes('/about')) {
            route.alias.push('/about');
          }
        }
    
        return route;
      },
    }),
    Layouts(),

    // Then the Vue and Vuetify plugins
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Exclude virtual modules from dependency optimization
  optimizeDeps: {
    exclude: ['virtual:generated-pages', 'virtual:generated-layouts'],
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',

    // This function builds an array of routes to statically generate.
    includedRoutes: async (paths) => {
      // **Ensure the homepage is included:** If it isn’t already present, add "/"
      if (!paths.includes('/')) {
        paths.push('/');
      }

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

    // Remove unwanted hydration scripts on blog pages and inject the SSG-components script.
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
          /https:\/\/content\.thegovlab\.com\/assets\/([a-f0-9-]+)(?:\?[^"]*)?/gi,
          (match, uuid) => {
            const filename = uuidToFileMap[uuid.toLowerCase()];
            return filename ? `${assetPrefix}assets/${filename}` : match;
          }
        );
      
      // For blog pages, remove all hydration scripts and add container divs with our SSG-components script.
      if (route.startsWith('/blog/') || route.startsWith('/')) {
        html = html.replace(/(<script[^>]*?>)([\s\S]*?<\/script>)/gi, '');
        html = html.replace(
          /<\/body>/i,
          `<div id="chat"></div>
<script type="module" src="${assetPrefix}assets/ssg-components.js"></script>
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
        // Extra entry for your SSG components bundle.
        'ssg-components': resolve(__dirname, 'src/ssg-components.js'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-prod.js',
        assetFileNames: 'assets/pp-prod.css',
        // Optionally extract the chat component into its own chunk:
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