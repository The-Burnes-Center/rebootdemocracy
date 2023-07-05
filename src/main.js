import { createApp } from 'vue'
import './assets/styles.css'
import App from './App.vue'
import router from './router'
import { createHead } from "@vueuse/head"
// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

createApp(App).use(router, createHead()).use(vuetify).mount('#app')
