// main.js
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { createHead } from '@unhead/vue';


// Import your custom page component
import BlogPage from './pages/blog-page.vue';
import AboutPage from './pages/index.vue';

// Vuetify
import { createVuetify } from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import './assets/styles.css';

const vuetify = createVuetify({
  // Add any Vuetify configuration here
});

// Set up layouts
let routes = setupLayouts(generatedRoutes);

// Modify the routes array directly
const rootRouteIndex = routes.findIndex((route) => route.path === '/');

if (rootRouteIndex !== -1) {
  // Replace the existing route
  routes[rootRouteIndex] = {
    path: '/',
    component: BlogPage,
  };
} else {
  // Add the route if it doesn't exist
  routes.push({
    path: '/',
    component: BlogPage,
  });
}

routes.push({
  path: '/about',
  component: AboutPage,
});

export const createApp = ViteSSG(
  App,
  {
    routes, // Use the modified routes
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