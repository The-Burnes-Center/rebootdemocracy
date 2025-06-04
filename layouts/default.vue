<template>
  <div class="layout">
    <DefaultHeader :topicTags="tags" />
      <div class="header-spacer"></div>
     <main class="main-content">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { useAsyncData } from "#app";
import { fetchAllUniqueTagsForSSG } from "../composables/fetchAllUniqueTagsSSG";
const { data: tags } = await useAsyncData(
  "topic-tags",
  fetchAllUniqueTagsForSSG
);
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}

</style>