<template>
  <div class="header-dropdown__container" v-if="openDropdown === index">
    <div class="header-dropdown__inner">
      <NuxtLink
        v-for="(item, idx) in items"
        :key="idx"
        :to="item.to"
        class="header-dropdown__item"
        :target="item.external ? '_blank' : '_self'"
        @click="handleItemClick"
      >
        <span class="header-dropdown__itemLabel">{{ item.label }}</span>
      </NuxtLink>
    </div>
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

const emit = defineEmits(['close']);

function handleItemClick() {
  emit('close');
}

</script>