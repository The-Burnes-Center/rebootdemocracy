<template>
  <header class="header-content__section">
    <div class="header__logo">
        <div class="hero__partner hero__first-partner">
          <img
            src="/images/burnes-logo-blues-1.png"
            alt="Burnes Center for Social Change"
          />
        </div>
        <div class="hero__partner hero__second-partner">
          <img src="/images/the-govlab-logo-white.png" alt="The GovLab" />
      </div>
    </div>
    
    <!-- Mobile menu toggle -->
    <div class="mobile-menu-toggle" @click="toggleMobileMenu" v-if="isMobile">
      <svg
        v-if="!mobileMenuOpen"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <mask
          id="mask0"
          style="mask-type: luminance"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <path d="M24 0H0V24H24V0Z" fill="white" />
        </mask>
        <g mask="url(#mask0)">
          <path
            d="M3 6H21M3 12H21M3 18H21"
            stroke="black"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M5 5L19 19M5 19L19 5"
          stroke="black"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    
    <nav v-if="!isMobile || (isMobile && mobileMenuOpen)">
        <HeaderMenu 
          :items="menuItems" 
          :class="{ 'mobile-menu': isMobile }" 
          @item-click="handleMenuClick"
        />
    </nav>
      
    <Button class="btn-header" variant="secondary" height="36px" @click="onClick"
            >Sign up for updates</Button
        >
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import type { BlogPost, MenuItem } from "@/types/index.ts";
import { useRouter, useRoute } from 'vue-router';


interface TagItem {
  id: string;
  name: string;
}

const router = useRouter();
const route = useRoute();

// State for mobile menu
const mobileMenuOpen = ref(false);
const isMobile = ref(false);

const toggleMobileMenu = (): void => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

// Custom handling for menu item clicks
const handleMenuClick = (item: MenuItem, event: MouseEvent): void => {
  // Handle team navigation
  if (item.name === 'team') {
    event.preventDefault();
    if (route.path !== '/about') {
      router.push({ 
        path: '/about', 
        hash: '#team-grid' 
      });
    } else {
      const teamSection = document.getElementById('team-grid');
      if (teamSection) {
        teamSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
  // Handle external links - open in same tab
  else if (item.external && item.to) {
    event.preventDefault();
    window.location.href = item.to;
  }
};

const baseMenuItems = ref<MenuItem[]>([
  {
    label: "Topic",
    name: "topic",
    children: [],
  },
  { label: "Home", name: "home", to: "/" },
  { label: "Blog", name: "blog", to: "/blog" },
  { label: "Events", name: "events", to: "/events" },
  {
    label: "About",
    name: "about",
    children: [
      { label: "About Us", name: "about", to: "/about" },
      { 
        label: "Our Team", 
        name: "team", 
        to: "/about#team-grid"
      },
    ]
  },
  {
    label: "Our Work",
    name: "work",
    children: [
      { label: "About Beth Noveck", name: "research", to: "https://thegovlab.org/beth-simone-noveck.html" },
      { label: "Teachings", name:"teachings", to:"https://innovate-us.org/"},
      { label: "University Teachings", name: "projects", to: "https://www.publicentrepreneur.org/" },
      { label: "Engagements", name: "partners", to: "/our-engagements" },
      { label: "Research", name: "research", to: "/our-research" },
       { label: "More Resources", name: "resources", to: "/more-resources" },
    ],
  },
  { label: "Sign up", name: "signup", to: "/signup", external: true },
]);

const menuItems = computed<MenuItem[]>(() =>
  isMobile.value
    ? baseMenuItems.value 
    : baseMenuItems.value.filter((item) => item.name !== "signup")
);

const onClick = (): void => {
  window.location.href = "/signup";
};

const checkIfMobile = (): void => {
  isMobile.value = window.innerWidth < 1050;
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
  }
};

const fetchAllBlogTags = async (): Promise<TagItem[]> => {
  try {
    const blogPosts = await fetchAllBlogPosts();
    return extractTags(blogPosts);
  } catch (error) {
    console.error("Error fetching blog tags:", error);
    return [];
  }
};

const populateTopicMenu = (tags: TagItem[]) => {
  // Since menuItems is now a computed property, we need to access the original ref
  const topicMenuItem = baseMenuItems.value.find((item) => item.name === "topic");

  if (topicMenuItem && topicMenuItem.children) {
    topicMenuItem.children = tags.map((tag) => ({
      label: tag.name,
      name: `topic-${tag.name.toLowerCase().replace(/\s+/g, "-")}`,
      to: `/blog?category=${encodeURIComponent(tag.name)}`,
    }));
  }
};

const extractTags = (posts: BlogPost[]): TagItem[] => {
  if (!posts || posts.length === 0) return [];

  // Create a Set to store unique tags
  const uniqueTags = new Set();

  // Collect all unique tags from posts
  posts.forEach((post) => {
    if (post.Tags && Array.isArray(post.Tags)) {
      post.Tags.forEach((tag) => {
        uniqueTags.add(tag);
      });
    }
  });

  return Array.from(uniqueTags)
    .map((name) => ({ id: name, name }))
    .sort((a, b) => a.name.localeCompare(b.name)); 
};


onMounted(async (): Promise<void> => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
  try {
    const tags = await fetchAllBlogTags();
    populateTopicMenu(tags);
  } catch (error) {
    console.error("Error loading blog tags for menu:", error);
  }
});

onUnmounted((): void => {
  window.removeEventListener("resize", checkIfMobile);
});
</script>