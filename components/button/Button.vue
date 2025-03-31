<template>
  <button
    @click="onClick"
    class="base__button"
    :class="[variantClass, { 'mobile-fullwidth': isMobile }]"
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

const isMobile = ref(false);

// Check for mobile screen size
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile(); // Initial check
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const variantClass = computed(() => `base__button--${props.variant}`);

const buttonStyle = computed(() => {
  const styles: Record<string, string> = {};
  
  if (props.height) {
    styles['--button-height'] = props.height;
  }
  
  // Only apply width on non-mobile or if explicitly set to override mobile
  if (props.width && (!isMobile.value || props.width === '100%')) {
    styles['--button-width'] = props.width;
  }
  
  // For mobile, ensure the width is 100%
  if (isMobile.value) {
    styles['--button-width'] = '100%';
  }
  
  return styles;
});

</script>
