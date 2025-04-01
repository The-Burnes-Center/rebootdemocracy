<template>
  <div class="author-card">
    <div class="author-card__header">
      <div class="author-card__image-container">
        <img 
          :src="imageUrl" 
          :alt="name" 
          class="author-card__image" 
        />
      </div>
      <div class="author-card__info">
        <Text 
          as="h3" 
          size="sm" 
          weight="bold" 
          class="author-card__name"
        >
          {{ name }}
        </Text>
        <Text 
          as="p" 
          size="xs" 
          weight="normal" 
          class="author-card__title"
        >
          {{ title }}
        </Text>
      </div>
    </div>
    
    <div class="author-card__body">
      <Text 
        as="p" 
        weight="light" 
        class="author-card__bio"
      >
        {{ bio }}
      </Text>
    </div>
    
    <div class="author-card__footer">
      <a :href="articlesLink" class="author-card__link">
        <Text
          as="span"
          size="base"
          weight="bold"
          color="link-primary"
        >
          View all articles
        </Text>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AuthorCardProps {
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
  articlesLink?: string;
}

const props = withDefaults(defineProps<AuthorCardProps>(), {
  articlesLink: '#'
});
</script>