<template>
  <section class="menu__section">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="header-menu__item-wrapper"
      @mouseenter="handleMouseOver(index)"
      @mouseleave="handleMouseLeaveWithDelay"
    >
      <NuxtLink
        v-if="!item.children"
        :to="item.to"
        class="header-menu__item"
        v-bind="
          item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
        "
      >
        <span class="header-menu__label">{{ item.label }}</span>
      </NuxtLink>

      <!--If dropdown has children render headerdropdown-->
      <div
        v-else
        class="header-menu__item header-menu__dropdown"
        @click="toggleDropdown(index)"
      >
        <span
          class="header-menu__label"
          :class="{ active: openDropdown === index }"
        >
          {{ item.label }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            class="dropdown-icon"
            :class="{ active: openDropdown === index }"
          >
            <path
              d="M12 2L6 8L-2.62268e-07 2L1.4 0.6L6 5.2L10.6 0.599999L12 2Z"
              fill="var(--color-icon)"
            />
          </svg>
        </span>
      </div>
    </div>
  </section>
   <HeaderDropdown
        v-if="openDropdown !== null && items[openDropdown]?.children?.length"
        :items="(items[openDropdown]?.children ?? []) as DropdownItem[]"
        :openDropdown="openDropdown"
        :index="openDropdown"
        @mouseenter="cancelClose"
        @mouseleave="handleMouseLeaveWithDelay"
      />
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import type { DropdownItem, MenuItem } from "@/types/index.ts";

interface Props {
  items: MenuItem[];
  initialTab?: number | null;
}

const props = defineProps<Props>();

const openDropdown = ref<number | null>(null);
const isMobile = ref<boolean>(false);

// Check if mobile on mount and when resized
onMounted((): (() => void) => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);

  return (): void => {
    window.removeEventListener("resize", checkIfMobile);
  };
});

function checkIfMobile(): void {
  isMobile.value = window.innerWidth < 768;
}

function toggleDropdown(index: number): void {
  openDropdown.value = openDropdown.value === index ? null : index;
}

function handleMouseOver(index: number): void {
  // Only use hover behavior on desktop
  if (!isMobile.value) {
    openDropdown.value = index;
  }
}

function handleMouseLeave(index: number): void {
  // Only use hover behavior on desktop
  if (!isMobile.value) {
    openDropdown.value = null;
  }
}

let closeTimeout: ReturnType<typeof setTimeout>;

function handleMouseLeaveWithDelay() {
  closeTimeout = setTimeout(() => {
    openDropdown.value = null;
  }, 500); // 200ms delay
}

function cancelClose() {
  clearTimeout(closeTimeout);
}

</script>
