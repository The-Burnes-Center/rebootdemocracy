<template>
  <Text
    as="p"
    :size="size"
    :weight="weight"
    :class="[marginClass, lineClampClass]"
    v-bind="$attrs"
  >
    <slot />
  </Text>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Text from "./Text.vue";

// Define margin options
const marginSizes = {
  none: "0",
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
} as const;

// Props interface
interface ParagraphProps {
  size?: string;
  weight?: string;
  margin?: keyof typeof marginSizes;
  marginTop?: keyof typeof marginSizes;
  marginBottom?: keyof typeof marginSizes;
  lineClamp?: number;
}

// Define props with defaults
const props = withDefaults(defineProps<ParagraphProps>(), {
  size: "base",
  weight: "normal",
  margin: "md",
  marginTop: undefined,
  marginBottom: undefined,
  lineHeight: "normal",
  lineClamp: 0,
});

// Compute margin classes
const marginClass = computed(() => {
  const classes = [];

  // Apply general margin if specific ones aren't provided
  if (!props.marginTop && !props.marginBottom) {
    classes.push(`paragraph-margin-${props.margin}`);
  }

  // Apply specific margins if provided
  if (props.marginTop) {
    classes.push(`paragraph-margin-top-${props.marginTop}`);
  }

  if (props.marginBottom) {
    classes.push(`paragraph-margin-bottom-${props.marginBottom}`);
  }

  return classes.join(" ");
});

// Compute line clamp class
const lineClampClass = computed(() => {
  return props.lineClamp > 0 ? `paragraph-line-clamp-${props.lineClamp}` : "";
});
</script>

