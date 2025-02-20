import { createApp } from './main.js';

function hydrateApp() {
  const { app } = createApp();
  app.mount('#app');
  // Remove the listener so hydration occurs only once.
  window.removeEventListener('click', hydrateApp, { once: true });
}

// Listen for the first user interaction (a click in this example).
// You may choose another event like 'touchstart' or 'scroll' if desired.
window.addEventListener('click', hydrateApp, { once: true });