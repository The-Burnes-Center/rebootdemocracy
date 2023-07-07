import { createRouter, createWebHistory } from "vue-router";

import Home from '../pages/index.vue';
import Events from '../pages/events.vue';

const routes = [
  { path:"/", component: Home },
  { path:"/events", component: Events },
]

const router = createRouter({
  history: createWebHistory(),
  base: './',
  routes
})



export default router