<template>
  <header class="header-content__section" role="banner">
    <div class="header__logo">
      <div class="hero__first-partner">
        <!-- <a
          href="https://burnes.northeastern.edu/"
          class="logo-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Burnes Center for Social Change website"
        >
          <img
            src="/images/burnes-center-white.png"
            alt="Burnes Center for Social Change logo"
            width="120"
            height="40"
            tabindex="-1"
            role="presentation"
          />
        </a> -->
        <a
          href="/"
          class="logo-link"
          aria-label="Visit Reboot Democracy website"
        >
          <img
            src="/images/logo.svg"
            alt="Reboot Democracy logo"
            width="187"
            height="50"
            tabindex="-1"
            role="presentation"
            class="logo-img"
          />
          <img
            src="/images/version=default.svg"
            alt="Reboot Democracy logo"
            width="187"
            height="50"
            tabindex="-1"
            role="presentation"
            class="logo-img-hover"
          />
        </a>
      </div>
      <!-- <div class="hero__second-partner">
        <a
          href="https://thegovlab.org/"
          class="logo-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit The GovLab website"
        >
          <img
            src="/images/the-govlab-logo-white.png"
            alt="The GovLab logo"
            width="100"
            height="40"
            tabindex="-1"
            role="presentation"
          />
        </a>
      </div> -->
    </div>

    <!-- Mobile menu toggle -->
    <div
      class="mobile-menu-toggle"
      @click="toggleMobileMenu"
      v-if="isMobile"
      :aria-expanded="mobileMenuOpen"
      :aria-label="
        mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
      "
      type="button"
    >
      <svg
        v-if="!mobileMenuOpen"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style="fill: #ffffff"
        aria-hidden="true"
        focusable="false"
        role="presentation"
      >
        <path
          d="M3 6H21M3 12H21M3 18H21"
          stroke="white"
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
        fill="black"
        aria-hidden="true"
        focusable="false"
        role="presentation"
      >
        <path
          d="M5 5L19 19M5 19L19 5"
          stroke="#000000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <nav
      v-show="!isMobile || (isMobile && mobileMenuOpen)"
      :class="{ 'nav-mobile-open': isMobile && mobileMenuOpen }"
      :aria-hidden="isMobile && !mobileMenuOpen"
      role="navigation"
      aria-label="Main navigation"
    >
      <HeaderMenu
        :items="menuItems"
        :class="{ 'mobile-menu': isMobile }"
        @item-click="handleMenuItemClick"
      />
    </nav>

    <Button
      class="btn-header"
      variant="secondary"
      height="40px"
      :onClick="onClick"
      aria-label="Sign up for weekly updates about democracy and governance"
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

  // Manage focus for mobile menu
  if (mobileMenuOpen.value) {
    document.addEventListener("keydown", handleMobileMenuKeydown);
  } else {
    document.removeEventListener("keydown", handleMobileMenuKeydown);
  }
};

const handleMobileMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    mobileMenuOpen.value = false;
    document.removeEventListener("keydown", handleMobileMenuKeydown);
    const menuButton = document.querySelector(
      ".mobile-menu-toggle"
    ) as HTMLElement;
    menuButton?.focus();
  }
};

const handleMenuClick = (item: MenuItem, event: MouseEvent): void => {
  event.preventDefault();

  if (item.name === "team") {
    router.push({ path: "/about", hash: "#team-editorial-section" });
  } else if (item.external && item.to) {
    window.location.href = item.to;
  } else if (item.to) {
    router.push(item.to);
  }
};

const handleMenuItemClick = (item: MenuItem, event: MouseEvent): void => {
  handleMenuClick(item, event);
  if (isMobile.value) {
    mobileMenuOpen.value = false;
    document.removeEventListener("keydown", handleMobileMenuKeydown);
  }
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
    // { label: "Blog", name: "blog", to: "/blog" },
    { label: "Events", name: "events", to: "/events" },
    {
      label: "About",
      name: "about",
      children: [
        {
          label: "About the Reboot Democracy Blog",
          name: "about",
          to: "/about",
        },
        {
          label: "Our Team",
          name: "team",
          to: "/about#team-editorial-section",
        },
        {
          label: "About Beth Simone Noveck",
          name: "research",
          to: "https://thegovlab.org/beth-simone-noveck.html",
          external: true,
        },
      ],
    },
    {
      label: "Our Work",
      name: "work",
      children: [
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
    { label: "Sign up", name: "signup", to: "/signup" },
  ];
});

const menuItems = computed<MenuItem[]>(() =>
  isMobile.value
    ? baseMenuItems.value
    : baseMenuItems.value.filter((item) => item.name !== "signup")
);

const onClick = (): void => {
  router.push("/signup");
};

const checkIfMobile = (): void => {
  isMobile.value = window.innerWidth < 1050;
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
    document.removeEventListener("keydown", handleMobileMenuKeydown);
  }
};

onMounted(() => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkIfMobile);
  document.removeEventListener("keydown", handleMobileMenuKeydown);
});
</script>

<style scoped>
.logo-link {
  display: inline-block;
  transition: all 0.2s ease-in-out;
  border-radius: 4px;
  padding: 4px;
  position: relative;
  height: 40px;
  width: 187px;
}

.logo-link:focus {
  outline: none;
  /* box-shadow: 0 0 0 2px #e3d9d9; */
}

/* .logo-link:hover {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
} */

/* Ensure images inside logo links don't get focus */
.logo-link img {
  display: block;
  max-width: 100%;
  height: auto;
  pointer-events: none; /* Prevents image from intercepting events */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.logo-img-hover {
  opacity: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.logo-link:hover .logo-img-hover {
  opacity: 1;
}

.logo-link:hover .logo-img {
  opacity: 0;
}

/* Ensure SVG icons don't interfere with focus */
.mobile-menu-toggle svg {
  pointer-events: none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .logo-link:focus,
  .mobile-menu-toggle:focus {
    box-shadow: 0 0 0 3px #ffffff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .logo-link,
  .mobile-menu-toggle {
    transition: none;
  }
}

/* Mobile adjustments */
@media (max-width: 1049px) {
  .logo-link img {
    left: 35%;
  }
}
</style>
