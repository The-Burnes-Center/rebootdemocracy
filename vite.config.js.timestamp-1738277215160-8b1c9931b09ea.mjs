// vite.config.js
import { defineConfig } from "file:///Volumes/scratchdisk/rebootdemocracy/node_modules/vite/dist/node/index.js";
import vue from "file:///Volumes/scratchdisk/rebootdemocracy/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vuetify from "file:///Volumes/scratchdisk/rebootdemocracy/node_modules/vite-plugin-vuetify/dist/index.mjs";
import Pages from "file:///Volumes/scratchdisk/rebootdemocracy/node_modules/vite-plugin-pages/dist/index.mjs";
import Layouts from "file:///Volumes/scratchdisk/rebootdemocracy/node_modules/vite-plugin-vue-layouts/dist/index.mjs";
import { createDirectus, rest, readItems } from "file:///Volumes/scratchdisk/rebootdemocracy/node_modules/@directus/sdk/dist/index.js";
import fs from "fs";
import path from "path";
import { load as cheerioLoad } from "file:///Volumes/scratchdisk/rebootdemocracy/node_modules/cheerio/dist/esm/index.js";
var assetsDir = path.join(process.cwd(), "dist", "assets");
var uuidToFileMap = {};
if (!fs.existsSync(assetsDir)) {
  console.warn(`Warning: "dist/assets" does not exist. Skipping Directus asset mapping...`);
} else {
  try {
    const files = fs.readdirSync(assetsDir);
    files.forEach((file) => {
      const [uuid, ...extParts] = file.split(".");
      if (uuid && extParts.length) {
        uuidToFileMap[uuid.toLowerCase()] = file;
      }
    });
  } catch (error) {
    console.error("Error reading files in dist/assets:", error);
  }
}
var vite_config_default = defineConfig({
  base: "",
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    Pages({ extensions: ["vue"] }),
    Layouts()
  ],
  ssgOptions: {
    script: "async",
    formatting: "minify",
    // 2) Pre-generate only new blog slugs, skipping existing HTML
    includedRoutes: async (paths) => {
      const distDir = path.join(process.cwd(), "dist");
      let slugToBuild = process.env.SLUG_TO_BUILD;
      if (process.env.INCOMING_HOOK_BODY) {
        try {
          const hookPayload = JSON.parse(process.env.INCOMING_HOOK_BODY);
          if (hookPayload.slug) {
            slugToBuild = hookPayload.slug;
          }
          if (slugToBuild) {
            console.log("Building only for slug:", slugToBuild);
          }
        } catch (error) {
          console.error("Error parsing INCOMING_HOOK_BODY JSON:", error);
        }
      }
      if (slugToBuild) {
        return [...paths, `/blog/${slugToBuild.toLowerCase()}`];
      }
      const directus = createDirectus("https://dev.thegovlab.com").with(rest());
      try {
        const response = await directus.request(
          readItems("reboot_democracy_blog", {
            fields: ["slug"],
            filter: { status: "published" },
            limit: -1
          })
        );
        const data = response.data || response;
        const routePaths = data.map((item) => `/blog/${item.slug.toLowerCase()}`);
        const finalRoutes = [];
        for (const route of routePaths) {
          const slugName = route.replace(/^\/blog\//, "");
          const possibleFile = path.join(distDir, "blog", `${slugName}.html`);
          if (fs.existsSync(possibleFile)) {
            console.log(`Skipping build for "${slugName}", already in dist/blog.`);
          } else {
            finalRoutes.push(route);
          }
        }
        return [...paths, ...finalRoutes];
      } catch (error) {
        console.error("Error fetching slugs from Directus:", error);
        return paths;
      }
    },
    // 3) Use cheerio in onPageRendered to do:
    //   - Make <script> and <link> references relative.
    //   - Rewrite "https://dev.thegovlab.com/assets" references to local if matching local files.
    //   - Do more fine-grained rewrites only in .content-body if desired.
    onPageRendered(route, html) {
      const depth = route.split("/").length - 1;
      const assetPrefix = "./" + "../".repeat(Math.max(depth - 1, 0));
      const $ = cheerioLoad(html);
      $("script[src]").each((_, el) => {
        const srcVal = $(el).attr("src");
        if (srcVal && !/^((https?:)?\/\/|data:)/i.test(srcVal)) {
          $(el).attr("src", assetPrefix + srcVal);
        }
      });
      $("link[href]").each((_, el) => {
        const hrefVal = $(el).attr("href");
        if (hrefVal && !/^((https?:)?\/\/|data:)/i.test(hrefVal)) {
          $(el).attr("href", assetPrefix + hrefVal);
        }
      });
      const $contentBody = $(".content-body");
      if ($contentBody.length) {
        const bodyHtmlOld = $contentBody.html() || "";
        const bodyHtmlNew = bodyHtmlOld.replace(
          // Regex for "https://dev.thegovlab.com/assets/<UUID> possibly .ext ? optional query"
          /https:\/\/content\.thegovlab\.com\/assets\/([a-f0-9-]+)(\.[a-z0-9]+)?(?:\?[^"]*)?/gi,
          (fullMatch, uuid, ext) => {
            const filename = uuidToFileMap[uuid.toLowerCase()];
            if (filename) {
              return `${assetPrefix}assets/${filename}`;
            } else {
              return fullMatch.replace(
                "https://dev.thegovlab.com/assets/",
                `${assetPrefix}assets/`
              );
            }
          }
        );
        $contentBody.html(bodyHtmlNew);
      }
      return $.html();
    }
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app-prod.js",
        chunkFileNames: "assets/_slug_-prod.js",
        assetFileNames: "assets/pp-prod.css"
      }
    }
  },
  ssr: {
    noExternal: [
      "vuetify",
      "@vuetify/*",
      "vue-router",
      "@vueuse/head",
      "@vueuse/core",
      "@directus/sdk",
      "@unhead/vue"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVm9sdW1lcy9zY3JhdGNoZGlzay9yZWJvb3RkZW1vY3JhY3lcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Wb2x1bWVzL3NjcmF0Y2hkaXNrL3JlYm9vdGRlbW9jcmFjeS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVm9sdW1lcy9zY3JhdGNoZGlzay9yZWJvb3RkZW1vY3JhY3kvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCB2dWV0aWZ5IGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZXRpZnknO1xuaW1wb3J0IFBhZ2VzIGZyb20gJ3ZpdGUtcGx1Z2luLXBhZ2VzJztcbmltcG9ydCBMYXlvdXRzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1sYXlvdXRzJztcbmltcG9ydCB7IGNyZWF0ZURpcmVjdHVzLCByZXN0LCByZWFkSXRlbXMgfSBmcm9tICdAZGlyZWN0dXMvc2RrJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbi8vIFRvIGRvIEhUTUwgbWFuaXB1bGF0aW9uIGluIG9uUGFnZVJlbmRlcmVkLCBpbnN0YWxsIGNoZWVyaW86XG4vLyAgIG5wbSBpbnN0YWxsIGNoZWVyaW9cbmltcG9ydCB7IGxvYWQgYXMgY2hlZXJpb0xvYWQgfSBmcm9tICdjaGVlcmlvJztcblxuLy8gMSkgQnVpbGQgYSBtYXAgb2YgRGlyZWN0dXMtZmlsZS1VVUlEIFx1MjE5MiBsb2NhbCBmaWxlbmFtZSBmcm9tIFwiZGlzdC9hc3NldHNcIiAoc2luY2UgdGhhdFx1MjAxOXMgd2hlcmUgdGhlIHNjcmlwdCB3cml0ZXMpXG5jb25zdCBhc3NldHNEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2Rpc3QnLCAnYXNzZXRzJyk7XG5jb25zdCB1dWlkVG9GaWxlTWFwID0ge307XG5cbmlmICghZnMuZXhpc3RzU3luYyhhc3NldHNEaXIpKSB7XG4gIGNvbnNvbGUud2FybihgV2FybmluZzogXCJkaXN0L2Fzc2V0c1wiIGRvZXMgbm90IGV4aXN0LiBTa2lwcGluZyBEaXJlY3R1cyBhc3NldCBtYXBwaW5nLi4uYCk7XG59IGVsc2Uge1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoYXNzZXRzRGlyKTtcbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICAvLyBGb3IgZXhhbXBsZTogXCI0OGE3YjhhNC0wZTY1LTQwNTItODhmNC04NGU3MzA4NWVmNzkucG5nXCJcbiAgICAgIGNvbnN0IFt1dWlkLCAuLi5leHRQYXJ0c10gPSBmaWxlLnNwbGl0KCcuJyk7XG4gICAgICBpZiAodXVpZCAmJiBleHRQYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgdXVpZFRvRmlsZU1hcFt1dWlkLnRvTG93ZXJDYXNlKCldID0gZmlsZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZWFkaW5nIGZpbGVzIGluIGRpc3QvYXNzZXRzOicsIGVycm9yKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnJyxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHZ1ZXRpZnkoeyBhdXRvSW1wb3J0OiB0cnVlIH0pLFxuICAgIFBhZ2VzKHsgZXh0ZW5zaW9uczogWyd2dWUnXSB9KSxcbiAgICBMYXlvdXRzKCksXG4gIF0sXG4gIHNzZ09wdGlvbnM6IHtcbiAgICBzY3JpcHQ6ICdhc3luYycsXG4gICAgZm9ybWF0dGluZzogJ21pbmlmeScsXG5cbiAgICAvLyAyKSBQcmUtZ2VuZXJhdGUgb25seSBuZXcgYmxvZyBzbHVncywgc2tpcHBpbmcgZXhpc3RpbmcgSFRNTFxuICAgIGluY2x1ZGVkUm91dGVzOiBhc3luYyAocGF0aHMpID0+IHtcbiAgICAgIGNvbnN0IGRpc3REaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2Rpc3QnKTtcbiAgICAgIGxldCBzbHVnVG9CdWlsZCA9IHByb2Nlc3MuZW52LlNMVUdfVE9fQlVJTEQ7XG5cbiAgICAgIC8vIElmIE5ldGxpZnkgaG9vayBjb250YWlucyBhIHNpbmdsZSBzbHVnXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuSU5DT01JTkdfSE9PS19CT0RZKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgaG9va1BheWxvYWQgPSBKU09OLnBhcnNlKHByb2Nlc3MuZW52LklOQ09NSU5HX0hPT0tfQk9EWSk7XG4gICAgICAgICAgaWYgKGhvb2tQYXlsb2FkLnNsdWcpIHtcbiAgICAgICAgICAgIHNsdWdUb0J1aWxkID0gaG9va1BheWxvYWQuc2x1ZztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNsdWdUb0J1aWxkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQnVpbGRpbmcgb25seSBmb3Igc2x1ZzonLCBzbHVnVG9CdWlsZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgSU5DT01JTkdfSE9PS19CT0RZIEpTT046JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIGhhdmUgYSBzaW5nbGUgc2x1ZyB0byBidWlsZCwgcmV0dXJuIG9ubHkgdGhhdCByb3V0ZVxuICAgICAgaWYgKHNsdWdUb0J1aWxkKSB7XG4gICAgICAgIHJldHVybiBbLi4ucGF0aHMsIGAvYmxvZy8ke3NsdWdUb0J1aWxkLnRvTG93ZXJDYXNlKCl9YF07XG4gICAgICB9XG5cbiAgICAgIC8vIE90aGVyd2lzZSwgZmV0Y2ggYWxsIHB1Ymxpc2hlZCBibG9nIHNsdWdzIGZyb20gRGlyZWN0dXNcbiAgICAgIGNvbnN0IGRpcmVjdHVzID0gY3JlYXRlRGlyZWN0dXMoJ2h0dHBzOi8vY29udGVudC50aGVnb3ZsYWIuY29tJykud2l0aChyZXN0KCkpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBkaXJlY3R1cy5yZXF1ZXN0KFxuICAgICAgICAgIHJlYWRJdGVtcygncmVib290X2RlbW9jcmFjeV9ibG9nJywge1xuICAgICAgICAgICAgZmllbGRzOiBbJ3NsdWcnXSxcbiAgICAgICAgICAgIGZpbHRlcjogeyBzdGF0dXM6ICdwdWJsaXNoZWQnIH0sXG4gICAgICAgICAgICBsaW1pdDogLTEsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2U7XG5cbiAgICAgICAgY29uc3Qgcm91dGVQYXRocyA9IGRhdGEubWFwKChpdGVtKSA9PiBgL2Jsb2cvJHtpdGVtLnNsdWcudG9Mb3dlckNhc2UoKX1gKTtcbiAgICAgICAgY29uc3QgZmluYWxSb3V0ZXMgPSBbXTtcblxuICAgICAgICAvLyBDaGVjayBpZiBkaXN0L2Jsb2cvPHNsdWc+Lmh0bWwgYWxyZWFkeSBleGlzdHM7IGlmIHNvLCBza2lwXG4gICAgICAgIGZvciAoY29uc3Qgcm91dGUgb2Ygcm91dGVQYXRocykge1xuICAgICAgICAgIGNvbnN0IHNsdWdOYW1lID0gcm91dGUucmVwbGFjZSgvXlxcL2Jsb2dcXC8vLCAnJyk7XG4gICAgICAgICAgY29uc3QgcG9zc2libGVGaWxlID0gcGF0aC5qb2luKGRpc3REaXIsICdibG9nJywgYCR7c2x1Z05hbWV9Lmh0bWxgKTtcbiAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwb3NzaWJsZUZpbGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2tpcHBpbmcgYnVpbGQgZm9yIFwiJHtzbHVnTmFtZX1cIiwgYWxyZWFkeSBpbiBkaXN0L2Jsb2cuYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsUm91dGVzLnB1c2gocm91dGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbLi4ucGF0aHMsIC4uLmZpbmFsUm91dGVzXTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHNsdWdzIGZyb20gRGlyZWN0dXM6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gcGF0aHM7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIDMpIFVzZSBjaGVlcmlvIGluIG9uUGFnZVJlbmRlcmVkIHRvIGRvOlxuICAgIC8vICAgLSBNYWtlIDxzY3JpcHQ+IGFuZCA8bGluaz4gcmVmZXJlbmNlcyByZWxhdGl2ZS5cbiAgICAvLyAgIC0gUmV3cml0ZSBcImh0dHBzOi8vY29udGVudC50aGVnb3ZsYWIuY29tL2Fzc2V0c1wiIHJlZmVyZW5jZXMgdG8gbG9jYWwgaWYgbWF0Y2hpbmcgbG9jYWwgZmlsZXMuXG4gICAgLy8gICAtIERvIG1vcmUgZmluZS1ncmFpbmVkIHJld3JpdGVzIG9ubHkgaW4gLmNvbnRlbnQtYm9keSBpZiBkZXNpcmVkLlxuICAgIG9uUGFnZVJlbmRlcmVkKHJvdXRlLCBodG1sKSB7XG4gICAgICBjb25zdCBkZXB0aCA9IHJvdXRlLnNwbGl0KCcvJykubGVuZ3RoIC0gMTtcbiAgICAgIC8vIEZvciBuZXN0ZWQgcm91dGVzLCBidWlsZCBhIHJlbGF0aXZlIHByZWZpeCAobGlrZSBcIi4uL2Fzc2V0cy9cIilcbiAgICAgIGNvbnN0IGFzc2V0UHJlZml4ID0gJy4vJyArICcuLi8nLnJlcGVhdChNYXRoLm1heChkZXB0aCAtIDEsIDApKTtcblxuICAgICAgLy8gUGFyc2UgdGhlIEhUTUwgd2l0aCBjaGVlcmlvXG4gICAgICBjb25zdCAkID0gY2hlZXJpb0xvYWQoaHRtbCk7XG5cbiAgICAgIC8vIDNhKSBSZXdyaXRlIHNjcmlwdFtzcmNdIGFuZCBsaW5rW2hyZWZdIGlmIHRoZXlcdTIwMTlyZSBsb2NhbCAobm90IGFic29sdXRlIG9yIGRhdGE6KVxuICAgICAgJCgnc2NyaXB0W3NyY10nKS5lYWNoKChfLCBlbCkgPT4ge1xuICAgICAgICBjb25zdCBzcmNWYWwgPSAkKGVsKS5hdHRyKCdzcmMnKTtcbiAgICAgICAgaWYgKHNyY1ZhbCAmJiAhL14oKGh0dHBzPzopP1xcL1xcL3xkYXRhOikvaS50ZXN0KHNyY1ZhbCkpIHtcbiAgICAgICAgICAkKGVsKS5hdHRyKCdzcmMnLCBhc3NldFByZWZpeCArIHNyY1ZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkKCdsaW5rW2hyZWZdJykuZWFjaCgoXywgZWwpID0+IHtcbiAgICAgICAgY29uc3QgaHJlZlZhbCA9ICQoZWwpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKGhyZWZWYWwgJiYgIS9eKChodHRwcz86KT9cXC9cXC98ZGF0YTopL2kudGVzdChocmVmVmFsKSkge1xuICAgICAgICAgICQoZWwpLmF0dHIoJ2hyZWYnLCBhc3NldFByZWZpeCArIGhyZWZWYWwpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gM2IpIFJld3JpdGUgZW1iZWRkZWQgYXNzZXQgcmVmZXJlbmNlcyBpbiB5b3VyIG1haW4gY29udGVudCwgZS5nLiAuY29udGVudC1ib2R5XG4gICAgICAvLyAgICAgVGhpcyBlbnN1cmVzIHRoYXQgPGltZyBzcmM9XCJodHRwczovL2NvbnRlbnQudGhlZ292bGFiLmNvbS9hc3NldHMveHh4XCI+PC9pbWc+IG9yXG4gICAgICAvLyAgICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKFwiaHR0cHM6Ly9jb250ZW50LnRoZWdvdmxhYi5jb20vYXNzZXRzL3h4eFwiKSBpcyByZXBsYWNlZFxuICAgICAgLy8gICAgIG9ubHkgaW4gdGhhdCBjb250YWluZXJcdTIwMTlzIEhUTUwuXG4gICAgICBjb25zdCAkY29udGVudEJvZHkgPSAkKCcuY29udGVudC1ib2R5Jyk7XG4gICAgICBpZiAoJGNvbnRlbnRCb2R5Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCBib2R5SHRtbE9sZCA9ICRjb250ZW50Qm9keS5odG1sKCkgfHwgJyc7XG4gICAgICAgIGNvbnN0IGJvZHlIdG1sTmV3ID0gYm9keUh0bWxPbGQucmVwbGFjZShcbiAgICAgICAgICAvLyBSZWdleCBmb3IgXCJodHRwczovL2NvbnRlbnQudGhlZ292bGFiLmNvbS9hc3NldHMvPFVVSUQ+IHBvc3NpYmx5IC5leHQgPyBvcHRpb25hbCBxdWVyeVwiXG4gICAgICAgICAgL2h0dHBzOlxcL1xcL2NvbnRlbnRcXC50aGVnb3ZsYWJcXC5jb21cXC9hc3NldHNcXC8oW2EtZjAtOS1dKykoXFwuW2EtejAtOV0rKT8oPzpcXD9bXlwiXSopPy9naSxcbiAgICAgICAgICAoZnVsbE1hdGNoLCB1dWlkLCBleHQpID0+IHtcbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBsb2NhbGx5IGRvd25sb2FkZWQgZmlsZSBmb3IgdGhhdCBVVUlELCB1c2UgaXRcbiAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gdXVpZFRvRmlsZU1hcFt1dWlkLnRvTG93ZXJDYXNlKCldO1xuICAgICAgICAgICAgaWYgKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgIC8vIGUuZy4sIFwiLi4vYXNzZXRzLzxmaWxlbmFtZT4/c29tZVF1ZXJ5XCJcbiAgICAgICAgICAgICAgLy8gb3IganVzdCBcIi4uLi9hc3NldHMvZmlsZW5hbWV3aXRob3V0cXVlcnlcIlxuICAgICAgICAgICAgICAvLyBJZiB0aGUgdXNlciB3YW50cyB0byBwcmVzZXJ2ZSB0aGUgZXh0ZW5zaW9uIGZyb20gdGhlIGxvY2FsIGZpbGUsIGRvOlxuICAgICAgICAgICAgICByZXR1cm4gYCR7YXNzZXRQcmVmaXh9YXNzZXRzLyR7ZmlsZW5hbWV9YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIElmIG5vIGxvY2FsIG1hdGNoLCBzdGlsbCByZXdyaXRlIGRvbWFpbiB0byByZWxhdGl2ZSAoZmFsbGJhY2spXG4gICAgICAgICAgICAgIHJldHVybiBmdWxsTWF0Y2gucmVwbGFjZShcbiAgICAgICAgICAgICAgICAnaHR0cHM6Ly9jb250ZW50LnRoZWdvdmxhYi5jb20vYXNzZXRzLycsXG4gICAgICAgICAgICAgICAgYCR7YXNzZXRQcmVmaXh9YXNzZXRzL2BcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgICRjb250ZW50Qm9keS5odG1sKGJvZHlIdG1sTmV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJuIHVwZGF0ZWQgSFRNTFxuICAgICAgcmV0dXJuICQuaHRtbCgpO1xuICAgIH0sXG4gIH0sXG5cbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogZmFsc2UsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL2FwcC1wcm9kLmpzJyxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvX3NsdWdfLXByb2QuanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9wcC1wcm9kLmNzcycsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG5cbiAgc3NyOiB7XG4gICAgbm9FeHRlcm5hbDogW1xuICAgICAgJ3Z1ZXRpZnknLFxuICAgICAgJ0B2dWV0aWZ5LyonLFxuICAgICAgJ3Z1ZS1yb3V0ZXInLFxuICAgICAgJ0B2dWV1c2UvaGVhZCcsXG4gICAgICAnQHZ1ZXVzZS9jb3JlJyxcbiAgICAgICdAZGlyZWN0dXMvc2RrJyxcbiAgICAgICdAdW5oZWFkL3Z1ZScsXG4gICAgXSxcbiAgfSxcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFIsU0FB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
