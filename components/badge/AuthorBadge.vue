<template>
  <div 
    class="author-badge" 
    role="listitem"
    :aria-label="`Team member: ${name}, ${title || 'Collaborator'}`"
  >
    <div class="author-badge__image-container">
      <img 
        :src="imageUrl" 
        :alt="`Photo of ${name}`" 
        class="author-badge__image"
        loading="lazy"
      />
    </div>
    <div class="author-badge__content">
      <h3 class="author-name">
        {{ name }}
      </h3>
      <h4 class="author-title" :aria-label="`Position: ${title || 'Collaborator'}`">
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
