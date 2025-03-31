<template>
  <Text :as="level" :weight="weight" :class="lineClampClass" :text="text" v-bind="$attrs">
    <slot />
  </Text>
</template>

<script lang="ts" setup>
import { computed } from 'vue'; 
// Define available heading levels
type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

// Props interface
interface TitleProps {
  level?: HeadingLevel;
  weight?: string;
  lineClamp?:number;
  text?: string;
}

// Define props with defaults
const props = withDefaults(defineProps<TitleProps>(), {
  level: 'h2',
  weight: 'normal',
  lineClamp: 0,
  text: '',
});

// Compute the line clamp class
const lineClampClass = computed(() => {
return props.lineClamp > 0 ? `title-line-clamp-${props.lineClamp}` : '';
});
</script>

