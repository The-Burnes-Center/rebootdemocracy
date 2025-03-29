<template>
  <section class="p-6">
    <h1 class="text-3xl font-bold mb-4">Welcome to Reboot blog app</h1>
    <p class="text-lg text-gray-600 mb-8">
      This is the homepage powered by Nuxt 3.
    </p>
  </section>

  <div class="blog-container">
    <PostCard
      v-for="(post, index) in blogPosts"
      :key="post.id"
      :tag="post.tag"
      :title="post.title"
      :author="post.author"
      :excerpt="post.excerpt"
      :imageUrl="post.imageUrl"
      :date="post.date"
      :tagColor="index % 2 === 0 ? '#5C69AB' : '#0D63EB'";
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

// Blog posts array with sample data
const blogPosts = ref([
  {
    id: 1,
    tag: "Internet Archive Book Talk",
    title: "Copyright, AI, and Great Power Competition",
    author: "Angelique Casem",
    excerpt:
      "A new paper by Joshua Levine and Tim Hwang explores how different nations approach AI policy and copyright regulation, and also what's at stake in the battle for technological dominance.",
    imageUrl: "/images/exampleImage.png",
    date: "2025-03-10",
  },
  {
    id: 2,
    tag: "Technology",
    title: "The Future of Web Development in 2025",
    author: "Michael Chen",
    excerpt:
      "Exploring the latest trends in web development, from AI-assisted coding to new frameworks that are revolutionizing how we build applications.",
    imageUrl: "/images/exampleImage.png",
    date: "2025-02-25",
  },
  {
    id: 3,
    tag: "Digital Libraries",
    title: "Preserving Knowledge in the Digital Age",
    author: "Sarah Johnson",
    excerpt:
      "How modern archivists are using technology to ensure information is preserved for future generations, despite rapidly changing formats and platforms.",
    imageUrl: "/images/exampleImage.png",
    date: "2025-02-15",
  },
  {
    id: 4,
    tag: "Open Source",
    title: "Community-Driven Innovation",
    author: "Angelique Casem",
    excerpt:
      "The power of open source communities in driving technological innovation and making knowledge accessible to all.",
    imageUrl: "/images/open-source.jpg",
    date: "2025-01-28",
  },
]);
</script>
