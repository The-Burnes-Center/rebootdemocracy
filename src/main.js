// main.ts
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { createHead } from '@unhead/vue';

export const createApp = ViteSSG(
  App,
  { 
    routes: setupLayouts(generatedRoutes),
    // You may need to specify history type if issues occur
  },
  (ctx) => {
    // Create the head instance
    const head = createHead();

    // Install the head instance to the app
    ctx.app.use(head);

    // Make head available in the app context
    ctx.head = head;

    // Any other plugins or setup code
  }
);