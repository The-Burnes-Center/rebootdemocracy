import { createRouter, createWebHistory } from "vue-router";

import Home from '../pages/index.vue';
import Events from '../pages/events.vue';
import Writing from '../pages/our-writing.vue';
import Research from '../pages/our-research.vue';
import Teaching from '../pages/our-teaching.vue';
import Engagement from '../pages/our-engagements.vue';
import Resources from '../pages/more-resources.vue';
import Team from '../pages/team.vue';
import Signup from '../pages/signup.vue';
import BlogPage from '../pages/blog-page.vue';
import BlogPost from '../pages/blog.vue';
import AllPosts from '../pages/all-blog-posts.vue';


const routes = [
  { path:"/", component: Home },
  { path:"/events", component: Events },
  { path:"/our-writing", component: Writing },
  { path:"/our-research", component: Research },
  { path:"/our-teaching", component: Teaching },
  { path:"/our-engagements", component: Engagement },
  { path:"/more-resources", component: Resources },
  { path:"/events/reboot-democracy", redirect: '/events?Reboot%20Democracy%20Lecture%20Series' },
  { path:"/team", component:Team },
  { path:"/signup", component:Signup },
  { path:"/blog/:name", component: BlogPost, props:true },
  { path:"/blog", component: BlogPage },
  { path:"/all-blog-posts", component: AllPosts },
]

const router = createRouter({
  history: createWebHistory(),
  base: './',
  routes
})



export default router