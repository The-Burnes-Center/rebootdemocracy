   import { ViteSSG } from 'vite-ssg';
   import App from './App.vue';
   import { createHead } from '@unhead/vue';
   import generatedRoutes from 'virtual:generated-pages';
   import { setupLayouts } from 'virtual:generated-layouts';
   import { createVuetify } from 'vuetify';
   import '@mdi/font/css/materialdesignicons.css';
   import 'vuetify/styles';
   import './assets/styles.css';

   // Create Vuetify
   const vuetify = createVuetify({});

   // Generate routes with layouts
   const routes = setupLayouts(generatedRoutes);

   export const createApp = ViteSSG(
     App,
     {
       routes,
       base: './'
     },
     (ctx) => {
       const isBlogPage = ctx.router.currentRoute.value.path.startsWith('/blog/');
       if (!isBlogPage) {
         const head = createHead();
         ctx.app.use(head);
         ctx.head = head;
       }
       ctx.app.use(vuetify);
       
       // Client-only: Wait for the window to load so the DOM is ready

     }
   );