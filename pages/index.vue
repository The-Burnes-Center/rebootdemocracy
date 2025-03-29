<!-- Page that uses the TabSwitch component -->
<template>
  <section class="p-6">
    <h1 class="text-3xl font-bold mb-4">Welcome to Reboot blog app</h1>
    <p class="text-lg text-gray-600 mb-8">
      This is the homepage powered by Nuxt 3.
    </p>
    <TabSwitch
      :tabs="tabs"
      :initialTab="0"
      @tab-changed="onTabChanged"
    >
      <template #latestposts>
        <div class="space-y-4">
          <div
            v-for="post in blogPosts"
            :key="post.id"
            class="p-4 border rounded-md shadow-sm"
          >
            <h2 class="text-xl font-semibold">{{ post.title }}</h2>
            <p class="text-sm text-gray-500 mb-2">
              by {{ post.author }} — {{ post.date }}
            </p>
            <p class="text-gray-700">{{ post.excerpt }}</p>
          </div>
        </div>
      </template>
    </TabSwitch>
  </section>
</template>

<script setup>
import { ref } from "vue";

// Tab data with correct structure
const tabs = [
  { title: 'Latest Posts', name: 'latestposts' },
  {
    title: 'News that caught our eye',
    name: 'news',
    url: 'https://rebootdemocracy.ai/news',
    external: true
  },
  {
    title: 'Events',
    name: 'events',
    url: 'https://rebootdemocracy.ai/events',
    external: true
  },
];

// Tab state tracking
const currentTabName = ref("latestposts");

// Tab change handler - fixed function name to match template
const onTabChanged = (index, name) => {
  console.log(`Tab changed to index ${index} with name ${name}`);
  currentTabName.value = name;
};

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