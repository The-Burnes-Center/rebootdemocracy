<template>
  <div class="header-dropdown__container" v-if="openDropdown === index">
    <NuxtLink
      v-for="(item, index) in items"
      :key="index"
      :to="item.to"
      class="header-dropdown__item"
      :target="item.external ? '_blank' : 'self'"
    >
      <span class="header-dropdown__itemLabel">{{ item.label }}</span>
    </NuxtLink>
  </div>
</template>

<script lang="ts" setup>

interface DropdownItem {
  label: string;
  name: string;
  to?: string;
  external?: boolean;
}
defineProps<{
  items: DropdownItem[];
  index: number;
  openDropdown: number | null;
}>();
</script>