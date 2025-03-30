<template>
  <section class="menu__section">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="header-menu__item-wrapper"
      @mouseover="openDropdown = index"
      @mouseleave="openDropdown = null"
     
    >
      <NuxtLink
        v-if="!item.children"
        :to="item.to"
        class="header-menu__item"
        :target="item.external ? '_blank' : 'self'"
      >
        <span class="header-menu__label" >{{ item.label }}</span>
      </NuxtLink>

      <!--If dropdown has children render headerdropdown-->
      <div v-else class="header-menu__item header-menu__dropdown" @click="toggleDropdown(index)">
        <span class="header-menu__label"  :class="{ 'active': openDropdown === index }">
          {{ item.label }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            class="dropdown-icon"
            :class="{ 'active': openDropdown === index }"
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
          />
    </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
interface MenuItem {
  label: string;
  name: string;
  to?: string;
  external?: boolean;
  children?: MenuItem[];
}

defineProps<{
  items: MenuItem[];
  initialTab?: number;
}>();

const openDropdown = ref<number | null>(null)

function toggleDropdown(index: number) {
  openDropdown.value = openDropdown.value === index ? null : index
}

</script>
