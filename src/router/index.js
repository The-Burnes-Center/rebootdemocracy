import { createRouter, createWebHistory } from "vue-router";

import Home from '../pages/index.vue';
import Events from '../pages/events.vue';
import Writing from '../pages/our-writing.vue';

const routes = [
  { path:"/", component: Home },
  { path:"/events", component: Events },
  { path:"/our-writing", component: Writing },
]

const router = createRouter({
  history: createWebHistory(),
  base: './',
  routes
})



export default router