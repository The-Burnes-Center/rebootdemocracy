<template>
  <header class="header-content__section">
    <div class="header__logo">
      <slot name="logo">reboot_democracy.ai</slot>
    </div>

     
    <!-- Mobile menu toggle -->
    <div class="mobile-menu-toggle" @click="toggleMobileMenu" v-if="isMobile">
      <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <mask id="mask0_706_4166" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <path d="M24 0H0V24H24V0Z" fill="white"/>
        </mask>
        <g mask="url(#mask0_706_4166)">
          <path d="M3 6H21M3 12H21M3 18H21" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 5L19 19M5 19L19 5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <nav v-if="!isMobile || (isMobile && mobileMenuOpen)">
      <HeaderMenu
        :items="menuItems"
        :class="{ 'mobile-menu': isMobile }"
      />
    </nav>

    <!-- Search input with icon -->
     <div class="search-container" v-if="!isMobile">
      <input type="text" class="header__search" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="search-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z"
          fill="black"
        />
      </svg>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { MenuItem } from '@/types/index.ts';

// State for mobile menu
const mobileMenuOpen = ref<boolean>(false);
const isMobile = ref<boolean>(false);

// Toggle mobile menu
const toggleMobileMenu = (): void => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const menuItems: MenuItem[] = [
  { label: 'About', name: 'about', to: '/' },
  { label: 'Blog', name: 'blog', to: '/blog' },
  { label: 'Events', name: 'events', to: '/events' },
  {
    label: 'Our Work',
    name: 'work',
    children: [
      {
        label: 'About Beth Noveck',
        name: 'research',
        to: '/our-work/research',
      },
      {
        label: 'University Teachings',
        name: 'projects',
        to: '/our-work/projects',
      },
      { label: 'Engagements', name: 'partners', to: '/our-work/partners' },
    ],
  },
  { label: 'Sign up', name: 'signup', to: '/signup' },
];

// Check if we're on mobile (screen width < 768px)
const checkIfMobile = (): void => {
  isMobile.value = window.innerWidth < 1050;
  
  // If we switch to desktop view, make sure menu is closed
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
  }
};

// Add resize event listener on mount
onMounted((): void => {
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);
});

// Remove event listener on unmount
onUnmounted((): void => {
  window.removeEventListener('resize', checkIfMobile);
});
</script>
