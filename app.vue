<template>
    <div>
        <div v-if="!hydrated || routeLoading" class="route-loading-overlay" aria-live="polite" aria-busy="true">
          <div class="spinner" aria-label="Loading"></div>
        </div>
        <NuxtLayout> 
            <NuxtPage />
            <ChatWidget/>
        </NuxtLayout>
        <RebootDemocracyModal 
          v-if="modalData && showModal" 
          :modal-data="modalData" 
          @close="closeModal"
        />
    </div>
</template>

<script setup>
import { useState, useAsyncData } from '#app'
import { ref, onMounted, watch } from 'vue'
import { fetchModalData } from '@/composables/fetchModalData'

const routeLoading = useState('routeLoading', () => false)
const hydrated = ref(false)
const showModal = ref(false)

// Fetch modal data
const { data: modalData } = await useAsyncData('modal-data', fetchModalData)

// Watch for modal data and show modal when available
watch(modalData, (newData) => {
  console.log('[App] Modal data changed:', newData)
  if (newData) {
    console.log('[App] Modal status:', newData.status)
    console.log('[App] Modal visibility:', newData.visibility)
    
    // Show modal if status is published
    if (newData.status === 'published') {
      console.log('[App] Setting showModal to true (from watcher)')
      showModal.value = true
    }
  } else {
    console.log('[App] No modal data available')
    showModal.value = false
  }
}, { immediate: true })

onMounted(() => {
  hydrated.value = true
  
  // Also check on mount in case data was already available
  console.log('[App] Checking modal on mount:', modalData.value)
  if (modalData.value && modalData.value.status === 'published') {
    console.log('[App] Setting showModal to true (from onMounted)')
    showModal.value = true
  } else {
    console.log('[App] Modal not shown on mount - data:', modalData.value, 'status:', modalData.value?.status)
  }
})

const closeModal = () => {
  console.log('[App] Closing modal')
  showModal.value = false
}
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