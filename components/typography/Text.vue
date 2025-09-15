
<template>
  <component
    :is="as"
    :style="{
      fontSize,
      fontWeight: weightValue,
      color: fontColor,
      fontStyle: fontStyleValue,
      fontFamily: fontFamilyValue,
      textTransform: transformValue,
      ...marginStyle,
    }"
    :class="[alignmentClass, lineHeightClass, customClass]"
    :aria-label="ariaLabel"
    :role="role"
    :id="id"
  >
    <template v-if="$slots.default">
      <slot />
    </template>
    <template v-else-if="html">
      <div v-html="text" />
    </template>
    <template v-else>
      {{ text }}
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";

// Define base size mapping to rem values
const SizeToRem = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "1.5xl": "1.3rem", // 22px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2rem", // 32px
  "5xl": "2.25rem", // 36px
  "6xl": "3rem", // 48px
} as const;

// Element-specific default sizes
const ElementDefaultSizes = {
  h1: "2xl",
  h2: "xl",
  h3: "lg",
  h4: "base",
  h5: "sm",
  h6: "xs",
  p: "base",
  span: "base",
  a: "sm",
} as const;

const fontWeight = {
  normal: "300",
  medium: "400",
  semibold: "500",
  bold: "600",
  extrabold: "700",
  extradarkbold: "800",
};

// Define the default colors for texts
const textColors = {
  "text-primary": "#000",
  "text-dark": "#003366",
  "text-primary-light": "#FFFFFF",
  "text-secondary": "#0D63EB",
  "text-tertiary": "#062C51",
  "tag-primary": "rgb(0, 51, 102)",
  "tag-secondary": "#0D63EB",
  "link-primary": "#0D63EB",
};

const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

const fontStyleMap = {
  italic: "italic",
  normal: "normal",
};

const fontFamilyMap = {
  habibi: "var( --font-habibi)",
  // inria: "var(--font-inria)",
  sora: "var(--font-sora)",
  "habibi-bold": "var(--font-habibi-bold)",
};

const transformMap = {
  uppercase: "uppercase",
  lowercase: "lowercase",
  capitalize: "capitalize",
  none: "none",
};

// Define line height options
const lineHeights = {
  tight: "1.25", // 20px
  normal: "1.5", // 24px
  relaxed: "1.75", // 28px
  extraRelaxed: "1.875", // 30px
  loose: "2", // 32px
  "more-loose": "2.25", // 36px
  "extra-loose": "2.4", // 40px
  "super-loose": "2.8125", // 45px
} as const;

const marginSizes = {
  none: "0",
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
} as const;

interface TextProps {
  as?: keyof typeof ElementDefaultSizes;
  size?: keyof typeof SizeToRem;
  weight?: keyof typeof fontWeight;
  color?: keyof typeof textColors;
  align?: keyof typeof alignmentClasses;
  fontStyle?: keyof typeof fontStyleMap;
  fontFamily?: keyof typeof fontFamilyMap;
  lineHeight?: keyof typeof lineHeights;
  class?: string;
  transform?: keyof typeof transformMap;
  text?: string;
  html?: boolean;
  margin?: keyof typeof marginSizes;
  marginTop?: keyof typeof marginSizes;
  marginRight?: keyof typeof marginSizes;
  marginBottom?: keyof typeof marginSizes;
  marginLeft?: keyof typeof marginSizes;
  ariaLabel?: string;
  role?: string;
  id?: string;
}

// Define props with defaults
const props = withDefaults(defineProps<TextProps>(), {
  as: "p",
  size: undefined,
  weight: "normal",
  color: "text-primary",
  align: "left",
  fontStyle: "normal",
  fontFamily: "habibi",
  class: "",
  transform: "none",
  text: "",
  html: false,
  margin: "none",
  lineHeight: "normal",
  marginTop: undefined,
  marginRight: undefined,
  marginBottom: undefined,
  marginLeft: undefined,
  ariaLabel: undefined,
  role: undefined,
  id: undefined,
});

// ... (rest of computed properties remain the same)
const fontSize = computed(() => {
  if (props.size) {
    return SizeToRem[props.size];
  }
  const defaultSizeForElement = ElementDefaultSizes[props.as];
  return SizeToRem[defaultSizeForElement];
});

const weightValue = computed(() => fontWeight[props.weight]);
const fontColor = computed(() => textColors[props.color]);
const alignmentClass = computed(() => alignmentClasses[props.align]);
const fontStyleValue = computed(() => fontStyleMap[props.fontStyle]);
const fontFamilyValue = computed(() => fontFamilyMap[props.fontFamily]);
const customClass = computed(() => props.class);
const transformValue = computed(() => transformMap[props.transform]);
const lineHeightClass = computed(() => `paragraph-line-height-${props.lineHeight}`);

const marginStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (props.margin) styles.margin = marginSizes[props.margin];
  if (props.marginTop) styles.marginTop = marginSizes[props.marginTop];
  if (props.marginRight) styles.marginRight = marginSizes[props.marginRight];
  if (props.marginBottom) styles.marginBottom = marginSizes[props.marginBottom];
  if (props.marginLeft) styles.marginLeft = marginSizes[props.marginLeft];
  if (props.margin !== "none" && !props.marginTop && !props.marginRight && !props.marginBottom && !props.marginLeft) {
    styles.margin = marginSizes[props.margin];
  }

  return styles;
});
</script>
