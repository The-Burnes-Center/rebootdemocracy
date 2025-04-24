<template>
  <section class="menu__section">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="header-menu__item-wrapper"
    >
      <NuxtLink
        v-if="!item.children"
        :to="item.to"
        class="header-menu__item"
        v-bind="
          item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
        "
        @click="emitItemClick(item, $event)"
      >
        <span class="header-menu__label">{{ item.label }}</span>
      </NuxtLink>
      <!--If dropdown has children render headerdropdown-->
      <div v-else class="header-menu__item header-menu__dropdown">
        <span
          class="header-menu__label"
          :class="{
            active: openDropdown === index,
            'topic-label': item.name === 'topic',
          }"
          @click="toggleDropdownDesktopMobile(index)"
        >
          {{ item.label }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            class="dropdown-icon"
            :class="{
              active: openDropdown === index,
              'topic-icon': item.name === 'topic',
            }"
          >
            <path
              d="M12 2L6 8L-2.62268e-07 2L1.4 0.6L6 5.2L10.6 0.599999L12 2Z"
              fill="var(--color-icon)"
            />
          </svg>
        </span>
      </div>

      <!-- Render dropdown inline for mobile -->
      <div
        v-if="
          isMobile &&
          openDropdown === index &&
          item.children &&
          item.children.length
        "
        class="header-dropdown__mobile"
      >
        <NuxtLink
          v-for="(childItem, childIdx) in item.children"
          :key="childIdx"
          :to="childItem.to"
          class="header-dropdown__item-mobile"
          v-bind="{}"
          @click="emitItemClick(childItem, $event)"
        >
          <span class="header-dropdown__itemLabel-mobile">{{
            childItem.label
          }}</span>
        </NuxtLink>
      </div>
    </div>
  </section>
  <!-- Only render the dropdown component for desktop -->
  <HeaderDropdown
    v-if="
      !isMobile &&
      openDropdown !== null &&
      items[openDropdown]?.children?.length
    "
    :items="(items[openDropdown]?.children ?? []) as DropdownItem[]"
    :openDropdown="openDropdown"
    :index="openDropdown"
    @close="closeDropdown"
  />
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import type { DropdownItem, MenuItem } from "@/types/index.ts";

interface Props {
  items: MenuItem[];
  initialTab?: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits(["item-click"]);

const openDropdown = ref<number | null>(null);
const isMobile = ref<boolean>(false);

// Check if mobile on mount and when resized
onMounted(() => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
});

onUnmounted(() => window.removeEventListener("resize", checkIfMobile));

function checkIfMobile(): void {
  isMobile.value = window.innerWidth < 1050;
}

function toggleDropdownDesktopMobile(index: number): void {
  openDropdown.value = openDropdown.value === index ? null : index;
}

function handleMouseOver(index: number): void {
  if (!isMobile.value) {
    openDropdown.value = index;
  }
}

function closeDropdown(): void {
  openDropdown.value = null;
}
function handleOutsideClick(event: MouseEvent): void {
  if (!isMobile.value && openDropdown.value !== null) {
    // Check if click was outside the header menu
    const menuElement = document.querySelector('.menu__section');
    const dropdownElement = document.querySelector('.header-dropdown');
    
    if (menuElement && dropdownElement) {
      if (!menuElement.contains(event.target as Node) && 
          !dropdownElement.contains(event.target as Node)) {
        openDropdown.value = null;
      }
    }
  }
}

// Emit click event to parent to close mobile menu
function emitItemClick(item: MenuItem, event: MouseEvent): void {
  emit("item-click", item, event);
}
</script>
