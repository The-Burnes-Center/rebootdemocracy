import { createRouter, createWebHistory } from "vue-router";

import Home from '../pages/index.vue';
import Events from '../pages/events.vue';
import Writing from '../pages/our-writing.vue';
import Research from '../pages/our-research.vue';

const routes = [
  { path:"/", component: Home },
  { path:"/events", component: Events },
  { path:"/our-writing", component: Writing },
  { path:"/our-research", component: Research },
]

const router = createRouter({
  history: createWebHistory(),
  base: './',
  routes
})



export default router