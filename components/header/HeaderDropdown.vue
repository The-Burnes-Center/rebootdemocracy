<!-- HeaderDropdown.vue (Fixed version) -->
<template>
  <div class="header-dropdown__container" v-if="openDropdown === index">
    <div class="header-dropdown__inner">
      <template v-for="(item, idx) in items" :key="idx">
        <!-- Use regular anchor tags with full URLs for external links -->
        <a 
          v-if="item.external && item.to" 
          :href="item.to"
          class="header-dropdown__item"
        >
          <span class="header-dropdown__itemLabel">{{ item.label }}</span>
        </a>
        
        <!-- Use NuxtLink for internal routes -->
        <NuxtLink 
          v-else
          :to="item.to || ''"
          class="header-dropdown__item"
          @click="handleInternalClick(item, $event)"
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
</script>

