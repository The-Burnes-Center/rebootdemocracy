<template>
  <div class="blog-container">
    <h1 class="blog-title">Latest Blog Posts</h1>
    <UpcomingCard
      title="Workshop: Advanced Vue Techniques"
      excerpt="Join our virtual workshop to learn advanced Vue techniques and best practices."
      imageUrl="/images/exampleImage.png"
      backgroundColor="#FFFFFF"
      tagColor="#5C69AB"
      :onClick="() => handleEventRegistration()"
    />
    
    <!-- Single PostCard usage -->
    <PostCard
      tag="Internet Archive Book Talk"
      titleText="Copyright, AI, and Great Power Competition"
      author="Jane Smith"
      excerpt="Discover the benefits of creating a component-based design system and how it can streamline your development workflow. This guide covers the essential elements needed for a robust design system.This guide covers the essential elements needed for a robust design system.This guide covers the essential elements needed for a robust design system."
      imageUrl="/images/exampleImage.png"
      :date="new Date('2025-03-15')"
      variant="default"
      :hoverable="true"
      :tagIndex="0"
    />
    
    <!-- Using PostCard in a list -->
    <div class="blog-list">
      <PostCard
        v-for="(post, index) in blogPosts"
        :key="post.id"
        :tag="post.tag"
        :titleText="post.titleText"
        :author="post.author"
        :excerpt="post.excerpt"
        :imageUrl="post.imageUrl"
        :date="post.date"
        :variant="post.variant || 'default'"
        :hoverable="true"
        :tagIndex="index"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Sample blog posts data
const blogPosts = ref([
  {
    id: 1,
    tag: "Tutorial",
    titleText: "Getting Started with Vue 3 Composition API",
    author: "John Doe",
    excerpt: "Learn how to leverage the power of Vue 3's Composition API to build more maintainable components with better type support and reusable logic.",
    imageUrl: "/images/vue-composition-api.jpg",
    date: new Date('2025-03-20'),
    variant: "default"
  },
  {
    id: 2,
    tag: "Case Study",
    titleText: "Building a Component Library from Scratch",
    author: "Sarah Johnson",
    excerpt: "Follow our journey of creating a reusable component library that improved development speed by 40% and ensured consistent UI across our products.",
    imageUrl: "/images/component-library.jpg",
    date: new Date('2025-03-10'),
    variant: "outline"
  },
  {
    id: 3,
    tag: "News",
    titleText: "Vue 3.5 Release - What's New",
    author: "Michael Chen",
    excerpt: "Explore the latest features and improvements in Vue 3.5, including better TypeScript integration, performance enhancements, and new composition utilities.",
    imageUrl: "/images/vue-release.jpg",
    date: new Date('2025-02-28'),
    variant: "flat"
  }
]);
</script>

<style scoped>
.blog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-title {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  font-weight: bold;
}

.blog-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 3rem;
}
</style>