<template>
  <button
    @click="onClick"
    class="base__button"
    :aria-label="ariaLabel || label"
    :style="{
      '--bg-color': bgColor,
      '--border-color': borderColor || bgColor,
      '--bg-opacity': opacity,
      '--text-color': textColor,
    }"
  >
    <span class="base__btn-slot">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
interface ButtonProps {
  onClick: () => void;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  opacity: number;
  ariaLabel?:string;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  opacity: 1,
  borderColor: ''
});
</script>
