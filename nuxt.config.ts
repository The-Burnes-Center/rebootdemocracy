
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,
  css: [
    './components/styles/index.css',
    './assets/css/index.css'
  ],
  components: [
    {
      path: './components',
      pathPrefix: false,
      global: true
    }
  ]
});