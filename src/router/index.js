import { createRouter, createWebHistory } from "vue-router";

import Home from '../pages/index.vue';
import Events from '../pages/events.vue';
import Writing from '../pages/our-writing.vue';
import Research from '../pages/our-research.vue';
import Teaching from '../pages/our-teaching.vue';
import Engagement from '../pages/our-engagements.vue';
import Resources from '../pages/more-resources.vue';
import Signup from '../pages/signup.vue';
// const routes = [
//   { path:"/", component: Home },
//   { path:"/events", component: Events },
//   { path:"/our-writing", component: Writing },
//   { path:"/our-research", component: Research },
//   { path:"/our-teaching", component: Teaching },
//   { path:"/our-engagements", component: Engagement },
//   { path:"/more-resources", component: Resources },
//   { path:"/events/reboot-democracy", redirect: '/events?Reboot%20Democracy%20Lecture%20Series' },
// ]

const routes = [
  { path:"/", component: Events },
  { path:"/events", component: Events },
  { path:"/our-writing", component: Events },
  { path:"/our-research", component: Events },
  { path:"/our-teaching", component: Events },
  { path:"/our-engagements", component: Events },
  { path:"/more-resources", component: Events },
  { path:"/signup", component: Signup },
  { path:"/events/reboot-democracy", redirect: '/events?Reboot%20Democracy%20Lecture%20Series' },
]

const router = createRouter({
  history: createWebHistory(),
  base: './',
  routes
})



export default router