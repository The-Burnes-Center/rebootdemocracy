import { createApp } from './main.js';

async function hydrateApp() {
  // Wait for createApp() to finish and get the returned instance
  const { app } = await createApp();
  app.mount('#app');
  // Remove the listener so hydration happens only once.
  window.removeEventListener('click', hydrateApp, { once: true });
}

// Listen for the first user interaction (here a click)
window.addEventListener('click', hydrateApp, { once: true });