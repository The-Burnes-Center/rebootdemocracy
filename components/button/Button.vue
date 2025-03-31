<template>
  <button
    @click="onClick"
    class="base__button"
    :class="variantClass"
    :aria-label="ariaLabel"
  >
    <span class="base__btn-slot">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  /**
   * Function to call when the button is clicked
   */
  onClick: () => void

  /**
   * Determines the style variant of the button
   */
  variant: 'primary' | 'secondary'

  /**
   * Optional ARIA label for accessibility
   */
  ariaLabel?: string
}>()

/**
 * Computes the CSS class based on the button variant
 */
const variantClass = computed(() => `base__button--${props.variant}`)
</script>
