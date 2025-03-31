<template>
  <Text :as="'p'":weight="weight" :color="computedTagColor" v-bind="$attrs">
    <slot />
  </Text>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// Props interface
interface TagProps {
  weight: string;
  color?: string;
  index?: number; 
}

// Define props with defaults
const props = withDefaults(defineProps<TagProps>(), {
  weight: 'bold',
  color: undefined, 
  index: 0,
});

// Compute the tag color based on index or provided color
const computedTagColor = computed(() => {
  if (props.color) {
    return props.color;
  }
    return props.index % 2 === 0 ? 'tag-primary' : 'tag-secondary';
});
</script>