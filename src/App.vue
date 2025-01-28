<script setup>
import { ref, Suspense } from "vue";
// import { Directus } from "@directus/sdk";
import OpenAIChat from "./components/pschat.vue";
</script>

<template>
  <div class="app-container">
    <!-- Main content area -->
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <Suspense>
          <component :is="Component" />
          </Suspense>
        </keep-alive>
      </router-view>
    </div>

    <!-- OpenAI Chat component that's always visible -->
    <keep-alive>
      <OpenAIChat />
    </keep-alive>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
}

/* Add styles for OpenAIChat component positioning */
</style>