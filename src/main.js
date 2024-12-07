// main.ts
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { createHead } from '@unhead/vue';

// Vuetify
import { createVuetify } from 'vuetify'; // Import createVuetify
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons (optional)
import 'vuetify/styles'; // Import Vuetify styles
import './assets/styles.css'
// If using custom themes or additional styles, import them here
// import './assets/styles.scss'; // If you have a global SCSS file

const vuetify = createVuetify({
  // Add any Vuetify configuration here
});

export const createApp = ViteSSG(
  App,
  {
    routes: setupLayouts(generatedRoutes),
  },
  (ctx) => {
    // Create the head instance
    const head = createHead();

    // Install Vuetify and head instance to the app
    ctx.app.use(head);
    ctx.app.use(vuetify);

    // Make head available in the app context
    ctx.head = head;

    // Any other plugins or setup code
  }
);