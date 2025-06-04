<!-- layouts/blog.vue -->
<template>
  <div>
    <BlogHeader :topicTags="tags" />
     <div class="header-spacer"></div>
    <main>
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { useAsyncData } from '#app';
import { fetchAllUniqueTagsForSSG } from "../composables/fetchAllUniqueTagsSSG";
const { data: tags } = await useAsyncData("topic-tags", fetchAllUniqueTagsForSSG);
</script>