import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePluginRadar } from "vite-plugin-radar";
import ViteFonts from 'vite-plugin-fonts'
import { format } from 'date-fns';
import { isPast } from 'date-fns';

import Pages from "vite-plugin-pages";


// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  assetsInclude: ['**/*.png'],
  data () {
    return {
      format,
      isPast
    }
  },
  plugins: [
    VitePluginRadar({
      // Google Analytics tag inject
      enableDev: true,
      analytics: {
        id: 'G-GMTLB057VX',
      },
    }),
    vue(),
    Pages({
      dirs: 'src/pages',
      extensions: ['vue', 'ts'],
    }),
    ViteFonts({
      typekit: {
          /**
           * Typekit project id
           */
          id: 'tde3xym',

          /**
           * enable non-blocking renderer
           *   <link rel="preload" href="xxx" as="style" onload="this.rel='stylesheet'">
           * default: true
           */
          defer: true
        },
    })
  ],
  server: {
    host: '0.0.0.0',
    hmr: {
      host: 'localhost', // you could make this an ENV var
      port: '3005',
      path: '/'
    }
  },
}

)
