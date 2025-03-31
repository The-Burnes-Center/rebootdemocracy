<template>
  <button
    @click="onClick"
    class="base__button"
    :class="variantClass"
    :aria-label="ariaLabel"
    :style="buttonStyle"
  >
    <span class="base__btn-slot">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  onClick: () => void;
  variant: "primary" | "secondary";
  ariaLabel?: string;
  width?: string;
  height?: string;
}>();

const variantClass = computed(() => `base__button--${props.variant}`);

const buttonStyle = computed(() => {
  if (props.width || props.height) {
    return {
      '--button-width': props.width,
      '--button-height': props.height
    }
  }
  return {}
})
</script>
