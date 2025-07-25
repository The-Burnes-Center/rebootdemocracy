<template>
  <div
    class="card__container"
    :class="[
      `card--${variant}`,
      `card--${size}`,
      { 'card--hoverable': hoverable }
    ]"
    :tabindex="hoverable ? 0 : undefined"
    :role="role || 'article'"
    :aria-label="ariaLabel"
    @keydown="handleKeydown"
  >
    <div class="card__content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
interface CardProps {
  variant?: 'default' | 'outline' | 'flat' | 'featured';
  size?: 'small' | 'semimedium' | 'medium' | 'large' | 'extra-large' | 'normal';
  hoverable?: boolean;
  role?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  size: 'medium',
  hoverable: false,
  role: undefined,
  ariaLabel: undefined,
});

const emit = defineEmits(['click', 'keydown']);

const handleKeydown = (event: KeyboardEvent) => {
  if (props.hoverable && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    emit('click', event);
  }
  emit('keydown', event);
};
</script>

<style>
.card__container:focus {
  outline: 1px solid grey;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(13, 99, 235, 0.1);
}

.card--hoverable:hover,
.card--hoverable:focus {
  transition: transform 0.2s ease-in-out;
}
</style>