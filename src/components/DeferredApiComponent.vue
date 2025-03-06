<template>
    <div>
      <!-- This static text is rendered in the SSR HTML.
           It tells the user to click on the area, which will trigger hydration. -->
      <p id="load-trigger">Click here to load API data</p>
      
      <!-- When hydrated, and after the API call: -->
      <div v-if="loading">Loading...</div>
      <div v-else-if="results">
        <pre>{{ results }}</pre>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  
  const loading = ref(false);
  const results = ref<any>(null);
  
  async function loadData() {
    loading.value = true;
    try {
      // Example API call:
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      results.value = await response.json();
    } catch (err: any) {
      results.value = { error: err.message };
    }
    loading.value = false;
  }
  
  onMounted(() => {
    // Once the component is hydrated, automatically trigger the API call.
    loadData();
  });
  </script>