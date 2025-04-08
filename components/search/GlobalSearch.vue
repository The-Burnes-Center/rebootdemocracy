<template>
  <pre>{{ result }}</pre>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAlgoliaSearch } from '#imports';

// Use the correct composable from the Nuxt Algolia module
const { result, search } = useAlgoliaSearch('reboot test data');

onMounted(async () => {
  await search({
    query: "Bringing-Citizens-into-the-Courtroom",
  });
});
</script>