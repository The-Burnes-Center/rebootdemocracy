<template>
  <div class="author-badge">
    <div class="author-badge__image-container">
      <img 
        :src="imageUrl" 
        :alt="name" 
        class="author-badge__image" 
      />
    </div>
    <div class="author-badge__content">
      <Text 
        as="h3" 
        size="sm" 
        weight="bold" 
        class="author-badge__name"
      >
        {{ name }}
      </Text>
      <Text 
        as="p" 
        size="xs" 
        weight="normal" 
        class="author-badge__title"
      >
        {{ title }}
      </Text>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AuthorBadgeProps {
  name: string;
  title: string;
  imageUrl: string;
}

const props = defineProps<AuthorBadgeProps>();
</script>