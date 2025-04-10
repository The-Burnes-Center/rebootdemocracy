// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePluginRadar } from "vite-plugin-radar";
import ViteFonts from 'vite-plugin-fonts'
import Pages from "vite-plugin-pages";

// https://vitejs.dev/config
export default defineConfig({
  base: "/",
  assetsInclude: ['**/*.png'],
  plugins: [
    VitePluginRadar({
      enableDev: true,
      analytics: {
        id: 'G-L78LX2HS2N',
      },
    }),
    vue(),
    Pages({
      dirs: 'src/pages',
      extensions: ['vue', 'ts'],
    }),
    ViteFonts({
      typekit: {
        id: 'tde3xym',
        defer: true
      },
    })
  ],
  build: {
    rollupOptions: {
      external: [
        /^\/\.netlify\/images/, // Mark Netlify image URLs as external
      ],
    }
  },
  server: {
    host: '0.0.0.0',
  },
});