<script setup lang="ts">

const route      = useRoute()
const category   = decodeURIComponent(route.params.category as string)

const BlogIndex  = (await import('~/pages/blog/index.vue')).default
</script>

<template>
  <BlogIndex :initial-category="category" />
</template>
