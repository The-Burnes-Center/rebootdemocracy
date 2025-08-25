<template>
    <div>
        <div v-if="!hydrated || routeLoading" class="route-loading-overlay" aria-live="polite" aria-busy="true">
          <div class="spinner" aria-label="Loading"></div>
        </div>
        <NuxtLayout> 
            <NuxtPage />
            <ChatWidget/>
        </NuxtLayout>
      
    </div>
</template>

<script setup>
import { useState } from '#app'
import { ref, onMounted } from 'vue'
const routeLoading = useState('routeLoading', () => false)
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
.route-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

  .spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>