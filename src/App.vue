<script setup>
import { defineAsyncComponent } from "vue";
// Dynamically import the chat component so it’s in its own bundle (island)
const OpenAIChat = defineAsyncComponent(() => import('./components/pschat.vue'));
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

    <!-- OpenAI Chat component that must always remain interactive -->
    <client-only>
      <keep-alive>
        <OpenAIChat />
      </keep-alive>
    </client-only>
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
</style>