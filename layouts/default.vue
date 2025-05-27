<template>
  <div>
    <DefaultHeader :topicTags="tags" />
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
