import { createApp, defineAsyncComponent, h } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';

// ---------------------------------
// 1) CHAT PARTIAL HYDRATION
// ---------------------------------
const OpenAIChat = defineAsyncComponent(() => import('./components/pschat.vue'));
const vuetify = createVuetify({});

const chatApp = createApp({
  render: () => h(OpenAIChat)
});
chatApp.use(vuetify);
chatApp.mount('#chat');

// ---------------------------------
// 2) MENU PARTIAL HYDRATION
// ---------------------------------
const menuIsland = document.getElementById('menuIsland');
if (menuIsland) {
  // Lazy-load the menu component if you like,
  // or just import it directly if you prefer synchronous loading:
  import('./components/menu.vue').then(({ default: MenuComponent }) => {
    const menuApp = createApp(MenuComponent);
    menuApp.use(vuetify);
    menuApp.mount('#menuIsland');
  });
}