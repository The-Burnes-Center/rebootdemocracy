<template>
  <section class="menu__section">
    <NuxtLink
      v-for="(item, index) in items"
      :key="index"
      :to="item.to"
      class="header-menu__item"
      :target="item.external ? '_blank' : 'self'"
    >
     <span class="header-menu__label">{{ item.label }}</span>
    </NuxtLink>
  </section>
</template>

<script lang="ts" setup>
interface MenuItem {
  label: string;
  name: string;
  url?: string;
  external?: boolean;
}

defineProps<{
  items: MenuItem[];
  initialTab?: number;
}>();
</script>
