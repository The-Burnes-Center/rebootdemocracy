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
    
      <Button 
        class="view-all-articles"
        @click="viewAllArticles"
        variant="primary"
        width="100%"
        height="36px"
      >
        View All Articles
      </Button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps({
  author: {
    type: Object,
    required: true
  },
  imageUrl: {
    type: String,
    default: '/images/exampleImage.png'
  },
  name: {
    type: String,
    default: 'Unknown Author'
  },
  bio: {
    type: String,
    default: ''
  }
});

const router = useRouter();

// Function to navigate to the blog index page with author filter
const viewAllArticles = () => {
  router.push({
    path: '/blog',
    query: { author: props.name }
  });
};
</script>