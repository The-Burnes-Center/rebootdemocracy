<template>
  <header class="header-content__section">
   <div class="header__logo">
  <a href="https://burnes.northeastern.edu/" class="hero__first-partner">
    <img
      src="/images/burnes-branding-v4-bunes-center-logo-blue.svg"
      alt="Burnes Center for Social Change"
    />
  </a>
  <a href="https://thegovlab.org/"  class="hero__second-partner">
    <img src="/images/the-govlab-logo.svg" alt="The GovLab" />
  </a>
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
        <path
          d="M3 6H21M3 12H21M3 18H21"
          stroke="black"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
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

    <nav v-show="!isMobile || (isMobile && mobileMenuOpen)" :class="{ 'nav-mobile-open': isMobile && mobileMenuOpen }">
      <HeaderMenu
        :items="menuItems"
        :class="{ 'mobile-menu': isMobile }"
        @item-click="handleMenuItemClick"
      />
    </nav>

    <Button
      class="btn-header"
      variant="secondary"
      height="36px"
      :onClick="onClick"
    >
      Sign up for updates
    </Button>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import type { MenuItem } from "@/types/index.ts";
import { useRouter } from "vue-router";

interface Props {
  topicTags: string[];
}

const props = defineProps<Props>();

const router = useRouter();
const mobileMenuOpen = ref(false);
const isMobile = ref(false);

const toggleMobileMenu = (): void => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const handleMenuClick = (item: MenuItem, event: MouseEvent): void => {
  event.preventDefault();
  
  if (item.name === 'team') {
    router.push({ path: '/about', hash: '#team-grid' });
  } else if (item.external && item.to) {
    window.location.href = item.to;
  } else if (item.to) {
    router.push(item.to);
  }
};

const handleMenuItemClick = (item: MenuItem, event: MouseEvent): void => {
  handleMenuClick(item, event);
  if (isMobile.value) mobileMenuOpen.value = false;
};

const baseMenuItems = computed<MenuItem[]>(() => {
  const topicChildren: MenuItem[] = (props.topicTags ?? []).map((tag) => ({
    label: tag,
    name: `topic-${tag.toLowerCase().replace(/\s+/g, "-")}`,
    to: `/blog/category/${encodeURIComponent(tag)}`,
  }));

  return [
    { label: "Topic", name: "topic", children: topicChildren },
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
          external: true,
        },
        {
          label: "InnovateUS",
          name: "teachings",
          to: "https://innovate-us.org/",
          external: true,
        },
        {
          label: "Public Entrepreneur",
          name: "projects",
          to: "https://www.publicentrepreneur.org/",
          external: true,
        },
        { label: "Engagements", name: "partners", to: "/our-engagements" },
        { label: "Research", name: "research", to: "/our-research" },
        { label: "More Resources", name: "resources", to: "/more-resources" },
      ],
    },
    { label: "Sign up", name: "signup", to: "/signup", external: true },
  ];
});

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
  if (!isMobile.value) mobileMenuOpen.value = false;
};

onMounted(() => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkIfMobile);
});
</script>
