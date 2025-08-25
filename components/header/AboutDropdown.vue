<template>
  <div 
    class="about-dropdown__container" 
    v-if="isOpen"
    role="menu"
    aria-label="About menu"
  >
    <div class="about-dropdown__content">
      <NuxtLink
        v-for="(item, index) in items"
        :key="index"
        :to="item.to"
        class="about-dropdown__item"
        role="menuitem"
        @click="emitItemClick(item, $event)"
        @keydown="handleKeydown($event, item)"
        tabindex="0"
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

function handleKeydown(event: KeyboardEvent, item: MenuItem): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emitItemClick(item, event as any);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  }
}
</script>
