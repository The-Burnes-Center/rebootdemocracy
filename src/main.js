import { createApp } from 'vue'
import './assets/styles.css'
import App from './App.vue'
import router from './router'
import { createHead } from "@vueuse/head"

createApp(App).use(router, createHead()).mount('#app')
