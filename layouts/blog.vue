<!-- layouts/blog.vue -->
<template>
  <div class="layout">
    <BlogHeader :topicTags="tags" />
     <div class="header-spacer"></div>
   <main class="main-content">
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

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw;
 position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;

}

.main-content {
  flex: 1;
}

</style>