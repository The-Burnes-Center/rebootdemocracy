<template>
  <Text :as="'p'":weight="weight" :color="computedTagColor" v-bind="$attrs">
    <slot />
  </Text>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// Props interface
interface TagProps {
  weight?: 'bold' | 'normal' | 'medium' | 'semibold' | 'extrabold';
  color?: string;
  index?: number; 
}

// Define props with defaults
const props = withDefaults(defineProps<TagProps>(), {
  weight: 'extrabold',
  color: undefined, 
  index: 0,
});

// Compute the tag color based on index or provided color
const computedTagColor = computed(() => {
  if (props.color && ['tag-primary', 'tag-secondary', 'text-primary', 'text-secondary', 'text-tertiary', 'link-primary'].includes(props.color)) {
    return props.color as 'tag-primary' | 'tag-secondary' | 'text-primary' | 'text-secondary' | 'text-tertiary' | 'link-primary';
  }
  return props.index % 2 === 0 ? 'tag-primary' : 'tag-secondary';
});
</script>