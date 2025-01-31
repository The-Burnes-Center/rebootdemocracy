import { ViteSSG } from 'vite-ssg'
import App from './App.vue'

import { createHead } from '@unhead/vue'

// 1) Use vite-plugin-pages and vite-plugin-vue-layouts
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:generated-layouts'

// Vuetify (if you still need it)
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './assets/styles.css'

// Create Vuetify
const vuetify = createVuetify({})

// 2) Generate routes from “src/pages” + layouts
const routes = setupLayouts(generatedRoutes)

export const createApp = ViteSSG(
  // Root component
  App,

  // ViteSSG options
  {
    routes,
    base: './', // or use '/' if that's your desired base
  },

  // (ctx) => callback
  (ctx) => {
    // 3) Create the head instance
    const head = createHead()
    ctx.app.use(head)

    // 4) Use Vuetify
    ctx.app.use(vuetify)

    // Provide head in the application context if needed
    ctx.head = head
  }
)