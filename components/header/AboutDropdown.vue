<!-- AboutDropdown.vue -->
<template>
  <div class="about-dropdown__container" v-if="isOpen">
    <div class="about-dropdown__content">
      <NuxtLink 
        v-for="(item, index) in items" 
        :key="index" 
        :to="item.to" 
        class="about-dropdown__item"
        @click="emitItemClick(item, $event)"
      >
        <span class="about-dropdown__item-label">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DropdownItem, MenuItem } from "@/types/index.ts";

interface Props {
  items: DropdownItem[];
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["close", "item-click"]);

function emitItemClick(item: MenuItem, event: MouseEvent): void {
  emit('item-click', item, event);
  emit('close');
}
</script>

