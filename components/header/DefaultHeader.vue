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
      
    <Button class="btn-header" variant="primary" height="36px" @click="onClick"
            >Sign up for updates</Button
        >
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import type { MenuItem } from "@/types/index.ts";
import { useRouter, useRoute } from 'vue-router';

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

const baseMenuItems: MenuItem[] = [
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
      { label: "About Beth Noveck", name: "research", to: "/our-work/research" },
      { label: "University Teachings", name: "projects", to: "/our-work/projects" },
      { label: "Engagements", name: "partners", to: "/our-work/partners" },
    ],
  },
  { label: "Sign up", name: "signup", to: "https://rebootdemocracy.ai/signup", external: true },
];

const menuItems = computed<MenuItem[]>(() =>
  isMobile.value
    ? baseMenuItems 
    : baseMenuItems.filter((item) => item.name !== "signup")
);

const onClick = (): void => {
  // Use window.location.href for signup button to open in same tab
  window.location.href = "https://rebootdemocracy.ai/signup";
};

const checkIfMobile = (): void => {
  isMobile.value = window.innerWidth < 1050;
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
  }
};

onMounted((): void => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
});

onUnmounted((): void => {
  window.removeEventListener("resize", checkIfMobile);
});
</script>