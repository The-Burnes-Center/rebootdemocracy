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
import { useState, useRoute } from '#app'
import { ref, onMounted, computed } from 'vue'
import { fetchModalData } from '@/composables/fetchModalData'

const route = useRoute()
const routeLoading = useState('routeLoading', () => false)
const hydrated = ref(false)
const showModal = ref(false)
const modalData = ref(null)

// Only fetch and show modal on homepage
const isHomepage = computed(() => route.path === '/')

onMounted(async () => {
  hydrated.value = true
  
  // Only fetch modal data on client-side and only on homepage
  if (isHomepage.value) {
    console.log('[App] On homepage, fetching modal data client-side...')
    try {
      const data = await fetchModalData()
      modalData.value = data
      
      if (data && data.status === 'published') {
        console.log('[App] Modal data fetched, showing modal')
        showModal.value = true
      } else {
        console.log('[App] Modal not shown - data:', data, 'status:', data?.status)
      }
    } catch (error) {
      console.error('[App] Error fetching modal data:', error)
    }
  } else {
    console.log('[App] Not on homepage, skipping modal fetch')
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