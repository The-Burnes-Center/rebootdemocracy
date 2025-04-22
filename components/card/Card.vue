<template>
  <div
    class="card__container"
    :class="[
      `card--${variant}`,
      `card--${size}`,
      { 'card--hoverable': hoverable }
    ]"
    :tabindex="hoverable ? 0 : undefined"
    role="article"
  >
    <div class="card__content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
interface CardProps {
  variant?: 'default' | 'outline' | 'flat';
  size?: 'small' | 'medium' | 'large' | 'extra-large' | 'normal';
  hoverable?: boolean;
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  size: 'medium',
  hoverable: false
});
</script>
