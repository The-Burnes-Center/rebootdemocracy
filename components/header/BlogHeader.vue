<template>
  <header class="header-content__section">
    <div class="header__logo">
      <div class="hero__partner hero__first-partner">
        <img
          src="/images/burnes-branding-v4-bunes-center-logo-blue.svg"
          alt="Burnes Center for Social Change"
        />
      </div>
      <div class="hero__partner hero__second-partner">
        <img src="/images/the-govlab-logo.svg" alt="The GovLab" />
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
      <HeaderMenu
        :items="menuItems"
        :class="{ 'mobile-menu': isMobile }"
        @item-click="handleMenuItemClick"
      />
    </nav>
    <div class="search-container" v-if="!isMobile">
      <ais-instant-search
        :index-name="indexName"
        :search-client="algoliaClient"
      >
        <ais-search-box @input="handleSearchInput" @reset="handleSearchReset" />
      </ais-instant-search>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import type { BlogPost, MenuItem } from "@/types/index.ts";

import {
  AisInstantSearch,
  AisSearchBox,
  // @ts-ignore
} from "vue-instantsearch/vue3/es";
import useSearchState from "../../composables/useSearchState.js";

interface TagItem {
  id: string;
  name: string;
}

const router = useRouter();
const route = useRoute();
const indexName = "reboot_democracy_blog";

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

const handleMenuClick = (item: MenuItem, event: MouseEvent): void => {
  // Handle 'Our Team' anchor navigation
  if (item.name === "team") {
    event.preventDefault();
    router.push({
      path: "/about",
      hash: "#team-grid",
    });
  }
  // Handle external links
  else if (item.external && item.to) {
    event.preventDefault();
    window.location.href = item.to;
  }
};

const handleMenuItemClick = (item: MenuItem, event: MouseEvent): void => {
  handleMenuClick(item, event);

  if (isMobile.value) {
    mobileMenuOpen.value = false;
  }
};

const menuItems = ref<MenuItem[]>([
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
      { label: "Our Team", name: "team", to: "/about#team-grid" },
    ],
  },
  {
    label: "Our Work",
    name: "work",
    children: [
      {
        label: "About Beth Noveck",
        name: "research",
        to: "https://thegovlab.org/beth-simone-noveck.html",
      },
      {
        label: "InnovateUS",
        name: "teachings",
        to: "https://innovate-us.org/",
      },
      {
        label: "Public Entrepreneur",
        name: "projects",
        to: "https://www.publicentrepreneur.org/",
      },
      { label: "Engagements", name: "partners", to: "/our-engagements" },
      { label: "Research", name: "research", to: "/our-research" },
      { label: "More Resources", name: "resources", to: "/more-resources" },
    ],
  },
  { label: "Sign up", name: "signup", to: "/signup" },
]);

const populateTopicMenu = (tags: TagItem[]) => {
  const topicMenuItem = menuItems.value.find((item) => item.name === "topic");

  if (topicMenuItem && topicMenuItem.children) {
    topicMenuItem.children = tags.map((tag) => ({
      label: tag.name,
      name: `topic-${tag.name.toLowerCase().replace(/\s+/g, "-")}`,
      to: `/blog?category=${encodeURIComponent(tag.name)}`,
    }));
  }
};

const fetchAllBlogTags = async (): Promise<TagItem[]> => {
  try {
    const uniqueTags = await fetchAllUniqueTags();
    return uniqueTags.map((tag) => ({
      id: tag,
      name: tag,
    }));
  } catch (error) {
    console.error("Error fetching blog tags:", error);
    return [];
  }
};

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

const handleSearchReset = () => {
  updateSearchQuery("");
};

// Add resize event listener on mount
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

// Remove event listener on unmount
onUnmounted(async (): Promise<void> => {
  window.removeEventListener("resize", checkIfMobile);
});
</script>

<style scoped>
.search-container {
  position: relative;
  width: 300px;
}
</style>
