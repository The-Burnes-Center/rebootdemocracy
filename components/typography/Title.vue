<template>
  <Text :as="level" :weight="weight" :class="lineClampClass" v-bind="$attrs">
    <slot />
  </Text>
</template>

<script lang="ts" setup>
import Text from './Text.vue';

// Define available heading levels
type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

// Props interface
interface TitleProps {
  level?: HeadingLevel;
  weight?: string;
  lineClamp?:number;
}

// Define props with defaults
const props = withDefaults(defineProps<TitleProps>(), {
  level: 'h2',
  weight: 'bold',
  lineClamp: 0,
});

// Compute the line clamp class
const lineClampClass = computed(() => {
return props.lineClamp > 0 ? `title-line-clamp-${props.lineClamp}` : '';
});
</script>

