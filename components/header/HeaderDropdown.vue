<template>
  <div class="header-dropdown__container" v-if="openDropdown === index">
    <NuxtLink
      v-for="(item, idx) in items"
      :key="idx"
      :to="item.to"
      class="header-dropdown__item"
      :target="item.external ? '_blank' : 'self'"
      @click="emitItemClick(item, $event)"
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

const emit = defineEmits(['item-click']);

function emitItemClick(item: DropdownItem, event: MouseEvent): void {
  emit('item-click', item, event);
}
</script>