<template>
  <div class="author-badge">
    <div class="author-badge__image-container">
      <img :src="imageUrl" :alt="name" class="author-badge__image" />
    </div>
    <div class="author-badge__content">
      <h3 class="author-name">
        {{ name }}
      </h3>
      <h4 class="author-title">
        {{ title || 'Collaborator' }}
      </h4>
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
