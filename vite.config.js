import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { createDirectus, rest, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
// To do HTML manipulation in onPageRendered, install cheerio:
//   npm install cheerio
import { load as cheerioLoad } from 'cheerio';

// 1) Build a map of Directus-file-UUID → local filename from "dist/assets" (since that’s where the script writes)
const assetsDir = path.join(process.cwd(), 'dist', 'assets');
const uuidToFileMap = {};

if (!fs.existsSync(assetsDir)) {
  console.warn(`Warning: "dist/assets" does not exist. Skipping Directus asset mapping...`);
} else {
  try {
    const files = fs.readdirSync(assetsDir);
    files.forEach((file) => {
      // For example: "48a7b8a4-0e65-4052-88f4-84e73085ef79.png"
      const [uuid, ...extParts] = file.split('.');
      if (uuid && extParts.length) {
        uuidToFileMap[uuid.toLowerCase()] = file;
      }
    });
  } catch (error) {
    console.error('Error reading files in dist/assets:', error);
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

    // 2) Pre-generate only new blog slugs, skipping existing HTML
    includedRoutes: async (paths) => {
      const distDir = path.join(process.cwd(), 'dist');
      let slugToBuild = process.env.SLUG_TO_BUILD;

      // If Netlify hook contains a single slug
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
          console.error('Error parsing INCOMING_HOOK_BODY JSON:', error);
        }
      }

      // If we have a single slug to build, return only that route
      if (slugToBuild) {
        return [...paths, `/blog/${slugToBuild.toLowerCase()}`];
      }

      // Otherwise, fetch all published blog slugs from Directus
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

        const routePaths = data.map((item) => `/blog/${item.slug.toLowerCase()}`);
        const finalRoutes = [];

        // Check if dist/blog/<slug>.html already exists; if so, skip
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

    // 3) Use cheerio in onPageRendered to do:
    //   - Make <script> and <link> references relative.
    //   - Rewrite "https://content.thegovlab.com/assets" references to local if matching local files.
    //   - Do more fine-grained rewrites only in .content-body if desired.
    onPageRendered(route, html) {
      const depth = route.split('/').length - 1;
      // For nested routes, build a relative prefix (like "../assets/")
      const assetPrefix = './' + '../'.repeat(Math.max(depth - 1, 0));

      // Parse the HTML with cheerio
      const $ = cheerioLoad(html);

      // 3a) Rewrite script[src] and link[href] if they’re local (not absolute or data:)
      $('script[src]').each((_, el) => {
        const srcVal = $(el).attr('src');
        if (srcVal && !/^((https?:)?\/\/|data:)/i.test(srcVal)) {
          $(el).attr('src', assetPrefix + srcVal);
        }
      });

      $('link[href]').each((_, el) => {
        const hrefVal = $(el).attr('href');
        if (hrefVal && !/^((https?:)?\/\/|data:)/i.test(hrefVal)) {
          $(el).attr('href', assetPrefix + hrefVal);
        }
      });

      // 3b) Rewrite embedded asset references in your main content, e.g. .content-body
      //     This ensures that <img src="https://content.thegovlab.com/assets/xxx"></img> or
      //     background-image: url("https://content.thegovlab.com/assets/xxx") is replaced
      //     only in that container’s HTML.
      const $contentBody = $('.content-body');
      if ($contentBody.length) {
        const bodyHtmlOld = $contentBody.html() || '';
        const bodyHtmlNew = bodyHtmlOld.replace(
          // Regex for "https://content.thegovlab.com/assets/<UUID> possibly .ext ? optional query"
          /https:\/\/content\.thegovlab\.com\/assets\/([a-f0-9-]+)(\.[a-z0-9]+)?(?:\?[^"]*)?/gi,
          (fullMatch, uuid, ext) => {
            // If we have a locally downloaded file for that UUID, use it
            const filename = uuidToFileMap[uuid.toLowerCase()];
            if (filename) {
              // e.g., "../assets/<filename>?someQuery"
              // or just ".../assets/filenamewithoutquery"
              // If the user wants to preserve the extension from the local file, do:
              return `${assetPrefix}assets/${filename}`;
            } else {
              // If no local match, still rewrite domain to relative (fallback)
              return fullMatch.replace(
                'https://content.thegovlab.com/assets/',
                `${assetPrefix}assets/`
              );
            }
          }
        );
        $contentBody.html(bodyHtmlNew);
      }

      // Return updated HTML
      return $.html();
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