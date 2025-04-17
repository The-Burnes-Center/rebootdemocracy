<template>
  <section class="menu__section">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="header-menu__item-wrapper"
      @mouseover="handleMouseOver(index)"
      @mouseleave="handleMouseLeave(index)"
    >
      <NuxtLink
        v-if="!item.children"
        :to="item.to"
        class="header-menu__item"
        v-bind="item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}"
        @click="emitItemClick(item, $event)"
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
        <HeaderDropdown
          v-if="item.children && openDropdown === index"
          :items="item.children"
          :openDropdown="openDropdown"
          :index="index"
          @item-click="handleDropdownItemClick"
        />
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import type { MenuItem } from '@/types/index.ts';

interface Props {
  items: MenuItem[];
  initialTab?: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['item-click']);

const openDropdown = ref<number | null>(null);
const isMobile = ref<boolean>(false);

// Check if mobile on mount and when resized
onMounted((): (() => void) => {
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);

  return (): void => {
    window.removeEventListener('resize', checkIfMobile);
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

// Emit click event to parent
function emitItemClick(item: MenuItem, event: MouseEvent): void {
  emit('item-click', item, event);
}

// Handle clicks from dropdown items
function handleDropdownItemClick(item: MenuItem, event: MouseEvent): void {
  emit('item-click', item, event);
}
</script>