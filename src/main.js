// main.js
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import router from './router';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { createHead } from '@vueuse/head';

// CSS
import './assets/styles.css';

// Initialize plugins
const vuetify = createVuetify({
  components,
  directives,
});

const head = createHead();

// Export the createApp function
export const createApp = ViteSSG(
  App,
  {
    // Passing the router is optional if you define routes here
    routes: router.options.routes, // Use this if your router is set up this way
    // If you have other options, include them here
  },
  (ctx) => {
    const { app, router, isClient } = ctx;

    // Install plugins
    app.use(router);
    app.use(vuetify);
    app.use(head);

    // You can perform other operations here
  }
);