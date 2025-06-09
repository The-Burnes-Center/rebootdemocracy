<template>
  <section class="menu__section">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="header-menu__item-wrapper"
      :class="{ 'about-menu-wrapper': item.name === 'about' }"
      ref="menuItemRefs"
    >
      <!-- For items without children -->
      <template v-if="!item.children">
        <!-- External links use regular anchor tags -->
        <a 
          v-if="item.external && item.to"
          :href="item.to"
          class="header-menu__item"
        >
          <span class="header-menu__label">{{ item.label }}</span>
        </a>
        
        <!-- Internal links use NuxtLink -->
        <NuxtLink
          v-else
          :to="item.to || ''"
          class="header-menu__item"
          @click="emitItemClick(item, $event)"
        >
          <span class="header-menu__label">{{ item.label }}</span>
        </NuxtLink>
      </template>

      <!-- Dropdown logic for items with children -->
      <div v-else class="header-menu__item">
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

      <!-- Mobile dropdown for items with children -->
      <div
        v-if="
          isMobile &&
          openDropdown === index &&
          item.children &&
          item.children.length
        "
        class="header-dropdown__mobile"
      >
        <template v-for="(childItem, childIdx) in item.children" :key="childIdx">
          <!-- External links use regular anchor tags -->
          <a 
            v-if="childItem.external && childItem.to"
            :href="childItem.to"
            class="header-dropdown__item-mobile"
          >
            <span class="header-dropdown__itemLabel-mobile">{{ childItem.label }}</span>
          </a>
          
          <!-- Internal links use NuxtLink -->
          <NuxtLink
            v-else
            :to="childItem.to || ''"
            class="header-dropdown__item-mobile"
            @click="emitItemClick(childItem, $event)"
          >
            <span class="header-dropdown__itemLabel-mobile">{{ childItem.label }}</span>
          </NuxtLink>
        </template>
      </div>

      <!-- AboutDropdown component for desktop -->
     <NuxtLazyHydrate
          v-if="
            !isMobile &&
            openDropdown === index &&
            item.name === 'about' &&
            item.children &&
            item.children.length
          "
          :on-interaction="['click', 'hover']"
        >
          <AboutDropdown
            :items="(item.children ?? []) as DropdownItem[]"
            :isOpen="openDropdown === index"
            @close="closeDropdown"
            @item-click="emitItemClick"
          />
        </NuxtLazyHydrate>
    </div>
  </section>

      <NuxtLazyHydrate
            v-if="
              !isMobile &&
              openDropdown !== null &&
              items[openDropdown]?.name !== 'about' &&
              items[openDropdown]?.children?.length
            "
            :on-interaction="['click', 'hover']"
          >
            <HeaderDropdown
              :items="(items[openDropdown]?.children ?? []) as DropdownItem[]"
              :openDropdown="openDropdown"
              :index="openDropdown"
              @close="closeDropdown"
              @item-click="emitItemClick"
            />
          </NuxtLazyHydrate>
    </template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { DropdownItem, MenuItem } from "@/types/index.ts";
import { useRoute } from "vue-router";
const AboutDropdown = defineAsyncComponent(() => import('./AboutDropdown.vue'))
const HeaderDropdown = defineAsyncComponent(() => import('./HeaderDropdown.vue'))
interface Props {
  items: MenuItem[];
  initialTab?: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits(["item-click"]);

const openDropdown = ref<number | null>(null);
const isMobile = ref<boolean>(false);
const menuItemRefs = ref<HTMLElement[]>([]);
const route = useRoute();

// Check if mobile on mount and when resized
onMounted(() => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
  document.addEventListener("click", handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkIfMobile);
  document.removeEventListener("click", handleOutsideClick);
});

function checkIfMobile(): void {
  isMobile.value = window.innerWidth < 1050;
}

function toggleDropdownDesktopMobile(index: number): void {
  openDropdown.value = openDropdown.value === index ? null : index;
}

function closeDropdown(): void {
  openDropdown.value = null;
}

function handleOutsideClick(event: MouseEvent): void {
  if (!isMobile.value && openDropdown.value !== null) {
    const menuElement = document.querySelector(".menu__section");
    const dropdownElement = document.querySelector(
      ".header-dropdown__container"
    );
    const aboutDropdownElement = document.querySelector(
      ".about-dropdown__container"
    );

    if (event.target instanceof Element) {
      const clickedOnMenuLabel = event.target.closest(".header-menu__label");
      if (clickedOnMenuLabel) {
        return;
      }
    }

    const clickedOutside = !(
      menuElement?.contains(event.target as Node) ||
      dropdownElement?.contains(event.target as Node) ||
      aboutDropdownElement?.contains(event.target as Node)
    );

    if (clickedOutside) {
      openDropdown.value = null;
    }
  }
}

// Emit click event to parent to close mobile menu
function emitItemClick(item: MenuItem, event: MouseEvent): void {
  emit("item-click", item, event);
  // Close dropdown after clicking an item
  openDropdown.value = null;
}

watch(route, () => {
  openDropdown.value = null;
});
</script>

<style scoped>
.about-menu-wrapper {
  position: relative;
}
</style>
