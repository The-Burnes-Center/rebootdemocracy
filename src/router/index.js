import { createRouter, createWebHistory } from "vue-router";

import Home from '../pages/index.vue';


const routes = [
  { path:"/", component: Home },
]

const router = createRouter({
  history: createWebHistory(),
  base: './',
  routes
})



export default router