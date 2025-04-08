<template>
  <header class="header-content__section">
    <div class="header__logo">
      <slot name="logo">reboot_democracy.ai</slot>
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
          id="mask0_706_4166"
          style="mask-type: luminance"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <path d="M24 0H0V24H24V0Z" fill="white" />
        </mask>
        <g mask="url(#mask0_706_4166)">
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
      <HeaderMenu :items="menuItems" :class="{ 'mobile-menu': isMobile }" />
    </nav>
    <div class="search-container" v-if="!isMobile">
    <ais-instant-search ais-instant-search :index-name="indexName" :search-client="algoliaClient">
        <ais-search-box @input="handleSearchInput" @reset="handleSearchReset" />
      </ais-instant-search>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { MenuItem } from "@/types/index.ts";

import {
  AisInstantSearch,
  AisSearchBox,
  // @ts-ignore
} from "vue-instantsearch/vue3/es";
import useSearchState from "../../composables/useSearchState.js";

const indexName = "reboot test data";


const { updateSearchQuery, setIndexName, getAlgoliaClient } = useSearchState();
const algoliaClient = getAlgoliaClient();
setIndexName(indexName); 


// State for mobile menu
const mobileMenuOpen = ref<boolean>(false);
const isMobile = ref<boolean>(false);

// Toggle mobile menu
const toggleMobileMenu = (): void => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const menuItems: MenuItem[] = [
  { label: "About", name: "about", to: "/" },
  { label: "Blog", name: "blog", to: "/blog" },
  { label: "Events", name: "events", to: "/events" },
  {
    label: "Our Work",
    name: "work",
    children: [
      {
        label: "About Beth Noveck",
        name: "research",
        to: "/our-work/research",
      },
      {
        label: "University Teachings",
        name: "projects",
        to: "/our-work/projects",
      },
      { label: "Engagements", name: "partners", to: "/our-work/partners" },
    ],
  },
  { label: "Sign up", name: "signup", to: "/signup" },
];

// Check if we're on mobile
const checkIfMobile = (): void => {
  isMobile.value = window.innerWidth < 1050;
  // If we switch to desktop view, make sure menu is closed
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
  }
};

// Handle search input changes
const handleSearchInput = (event: InputEvent): void => {
  const query = (event.target as HTMLInputElement)?.value;
  updateSearchQuery(query);
};

// Add search input listeners
const setupSearchListeners = (): void => {
  const searchInput = document.querySelector(".ais-SearchBox-input");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const input = event.target as HTMLInputElement;
      updateSearchQuery(input.value);
    });
  }
};

const handleSearchReset = () => {
  updateSearchQuery("");
};

// Add resize event listener on mount
onMounted((): void => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);

  // Setup search listeners after component is mounted
  setTimeout(setupSearchListeners, 100);
});

// Remove event listener on unmount
onUnmounted((): void => {
  window.removeEventListener("resize", checkIfMobile);
});
</script>

<style scoped>
.search-container {
  position: relative;
  width: 300px;
}
</style>
