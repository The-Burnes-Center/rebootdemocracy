<template>
  <div 
    class="header-dropdown__container" 
    v-if="openDropdown === index"
    role="menu"
    aria-label="Navigation submenu"
  >
    <div class="header-dropdown__inner">
      <template v-for="(item, idx) in items" :key="idx">
        <!-- Use regular anchor tags with full URLs for external links -->
        <a
          v-if="item.external && item.to"
          :href="item.to"
          class="header-dropdown__item"
          role="menuitem"
          :aria-label="`${item.label} (opens in new window)`"
          @keydown="handleKeydown($event, item)"
          tabindex="0"
        >
          <span class="header-dropdown__itemLabel">{{ item.label }}</span>
        </a>
        
        <!-- Use NuxtLink for internal routes -->
        <NuxtLink
          v-else
          :to="item.to || ''"
          class="header-dropdown__item"
          role="menuitem"
          @click="handleInternalClick(item, $event)"
          @keydown="handleKeydown($event, item)"
          tabindex="0"
        >
          <span class="header-dropdown__itemLabel">{{ item.label }}</span>
        </NuxtLink>
      </template>
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

const emit = defineEmits(['close', 'item-click']);

function handleInternalClick(item: DropdownItem, event: MouseEvent) {
  emit('close');
  emit('item-click', item, event);
}

function handleKeydown(event: KeyboardEvent, item: DropdownItem): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (item.external && item.to) {
      window.open(item.to);
    } else {
      handleInternalClick(item, event as any);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  }
}
</script>