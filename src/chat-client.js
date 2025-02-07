import { createApp, defineAsyncComponent, h } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';

// Use a relative path so Vite recognizes and bundles the component.
const OpenAIChat = defineAsyncComponent(() => import('./components/pschat.vue'));

const app = createApp({
  render: () => h(OpenAIChat)
});

const vuetify = createVuetify({});
app.use(vuetify);
app.mount('#chat');