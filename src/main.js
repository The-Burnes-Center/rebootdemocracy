import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import { createHead } from '@unhead/vue';
import generatedRoutes from 'virtual:generated-pages';
import { createMemoryHistory, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import { setupLayouts } from 'virtual:generated-layouts';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import './assets/styles.css';

const history = import.meta.env.SSR
? createMemoryHistory()
: createWebHistory();

// Create Vuetify
const vuetify = createVuetify();

// Generate routes with layouts (using your generated routes)
const routes = setupLayouts(generatedRoutes);

// Export the createApp function with Vite‑SSG.
// Note: We do not explicitly call app.mount() here so that no hydration happens on load.
export const createApp = ViteSSG(
  App,
  {
    routes,
    base: './',
    history,
  },
  (ctx) => {
    // Example: apply head only to non-blog pages.
    const isBlogPage = ctx.router.currentRoute.value.path.startsWith('/blog/');
    if (!isBlogPage) {
      const head = createHead();
      ctx.app.use(head);
      ctx.head = head;
    }
    ctx.app.use(vuetify);
    // Do not trigger any automatic data fetching or extra logic on mount.
  }
);