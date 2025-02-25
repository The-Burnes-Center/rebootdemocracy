<!-- pages/blog/[slug].vue -->
<template>
    <div>
      <h1>Blog Post: {{ slug }}</h1>
      <p>This post was generated using ISR (Incremental Static Regeneration).</p>
    </div>
  </template>
  
  <script setup>
    // Retrieve dynamic slug from the URL
    const route = useRoute();
    const slug = route.params.slug;
  </script>
  