import { createApp } from 'vue'
import './assets/styles.css'
import App from './App.vue'
import router from './router'
// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { createHead } from "@vueuse/head"

// import Vue from 'vue'
// import Vuetify from 'vuetify'                                           

// Vue.use(Vuetify)
const head = createHead();

const vuetify = createVuetify({
  components,
  directives,
})

createApp(App).use(router, head).use(vuetify).mount('#app')
