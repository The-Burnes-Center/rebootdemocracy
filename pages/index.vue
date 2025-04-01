<template>
  <section class="page-layout">
    <article class="left-content">
      <!-- Show loading state -->
      <div v-if="isLoading" class="loading">Loading blogs...</div>
      
      <!-- Display blogs when loaded -->
      <div v-else-if="postData.length > 0" class="blog-list">
        <PostCard
          v-for="(post, index) in postData"
          :key="post.id"
          :tag="getPostTag(post)"
          :titleText="post.title"
          :author="getAuthorName(post)"
          :excerpt="post.excerpt || ''"
          :imageUrl="post.image?.filename_disk ? `${directusUrl}/assets/${post.image.filename_disk}` : '/images/default.png'"
          :date="new Date(post.date)"
          :tagIndex="index % 5"
          variant="default"
          :hoverable="true"
        />
      </div>
      
      <!-- No blogs found message -->
      <div v-else class="no-blogs">No blog posts found.</div>
    </article>
    
    <aside class="right-content">
      <UpcomingCard
        title="Copyright, AI, and Great Power Competition"
        excerpt="A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what's at stake in the battle for technological dominance.!"
        imageUrl="/images/exampleImage.png"
        :onClick="handleRegisterClick"
      />
    </aside>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import type { BlogPost } from "@/types/BlogPost.ts";
import { fetchBlogData } from "@/composables/fetchBlogData.ts";

// Set your Directus URL
const directusUrl = "https://content.thegovlab.com";
const postData = ref<BlogPost[]>([]);
const isLoading = ref(true);

// Function to handle register button click
const handleRegisterClick = () => {
  console.log('Register button clicked');
};

// Helper function to get author name
const getAuthorName = (post: BlogPost): string => {
  if (post.authors && post.authors.length > 0 && post.authors[0].team_id) {
    const author = post.authors[0].team_id;
    return `${author.First_Name} ${author.Last_Name}`;
  }
  return "Unknown Author";
};

const getPostTag = (post: BlogPost): string => {
  if (post.Tags && post.Tags.length > 0) {
    console.log('Post tags:', post.Tags);
    return post.Tags[0];
  }
  // Fallback to a default tag
  return "Blog";
};

// Function to load all blogs
const loadAllBlogs = async () => {
  try {
    isLoading.value = true;
    const data = await fetchBlogData();
    postData.value = data || [];
    console.log('Loaded blog posts:', postData.value);
  } catch (error) {
    console.error('Failed to load blogs:', error);
    postData.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Load blogs when component is mounted
onMounted(() => {
  loadAllBlogs();
});
</script>
