<template>
  <div v-if="shouldShow" class="modal-overlay" @click.self="closeModal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <Card
      class="modal-card"
      variant="featured"
      size="semimedium"
      :hoverable="false"
      role="dialog"
    >
      <button 
        class="modal-close" 
        @click="closeModal"
        aria-label="Close modal"
        type="button"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="modal-body-wrapper">
        <div class="modal-content">
          <Text
            as="h2"
            id="modal-title"
            size="3xl"
            weight="bold"
            fontFamily="sora"
            class="modal-title"
            lineHeight="more-loose"
            color="text-primary-light"
            textAlign="center" 
          >
            {{ modalData?.title }}
          </Text>
          
          <div 
            class="modal-body" 
            v-html="modalData?.content"
          ></div>
        </div>
        
        <div class="modal-footer">
          <a 
            :href="modalData?.button_url" 
            class="modal-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{{ modalData?.button_text }}</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ModalData } from '@/composables/fetchModalData';
import Card from '@/components/card/Card.vue';
import Text from '@/components/typography/Text.vue';

interface Props {
  modalData: ModalData | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

// For "always" visibility, we don't check localStorage - it should always show
// For "once" visibility, we check if it's been shown before
const shouldShow = computed(() => {
  if (!props.modalData) {
    console.log('[Modal Component] Not showing - no modal data');
    return false;
  }
  
  console.log('[Modal Component] Checking visibility:', props.modalData.visibility);
  
  // For 'always' visibility, always show (ignore localStorage)
  if (props.modalData.visibility === 'always') {
    console.log('[Modal Component] Showing - always visibility (ignoring localStorage)');
    return true;
  }
  
  // For 'once' visibility, check if already shown
  if (props.modalData.visibility === 'once' && typeof window !== 'undefined') {
    const shownKey = `modal_shown_${props.modalData.id}`;
    const alreadyShown = localStorage.getItem(shownKey) === 'true';
    console.log('[Modal Component] Once visibility - already shown:', alreadyShown);
    return !alreadyShown;
  }
  
  // Default: show if we have data (fallback)
  console.log('[Modal Component] Showing - fallback (has data)');
  return true;
});

const closeModal = () => {
  if (typeof window !== 'undefined' && props.modalData) {
    // For 'always' visibility, don't store anything in localStorage
    // It should show again on next page load
    
    // For 'once' visibility, mark as shown so it doesn't show again
    if (props.modalData.visibility === 'once') {
      const shownKey = `modal_shown_${props.modalData.id}`;
      localStorage.setItem(shownKey, 'true');
      console.log('[Modal Component] Marked as shown for once visibility');
    }
    
    // Clear any old dismissal keys for this modal (in case visibility was changed)
    const dismissedKey = `modal_dismissed_${props.modalData.id}`;
    localStorage.removeItem(dismissedKey);
  }
  
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
  overflow-y: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-card {
  position: relative;
  max-width: 800px;
  width: 100%;
  height: fit-content;
  animation: slideUp 0.3s ease-out;
  margin: auto;
  display: flex;
  flex-direction: column;
}

.modal-card :deep(.card__content) {
  display: flex;
  flex-direction: column;
  height: auto;
  flex: 0 1 auto;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  border-radius: 4px;
  transition: all 0.2s;
  z-index: 10;
  width: 40px;
  height: 40px;
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.modal-close:active {
  background: rgba(255, 255, 255, 0.4);
}

.modal-body-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  flex: 0 1 auto;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
  width: 100%;
}

.modal-title {
  margin: 0;
  color: #ffffff !important;
}

.modal-body {
  color: #ffffff !important;
  line-height: 1.6;
  font-family: var(--font-habibi);
  font-size: 1.3rem;
  font-weight: 400;
}

.modal-body :deep(p) {
  margin: 0 0 1rem 0;
  color: #ffffff;
  font-family: var(--font-habibi);
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.6;
  
}

.modal-body :deep(a) {
  color: #ffffff;
  text-decoration: underline;
  transition: opacity 0.2s;
  word-break: break-word;
}

.modal-body :deep(a:hover) {
  opacity: 0.8;
}

.modal-body :deep(iframe),
.modal-body :deep(video),
.modal-body :deep(embed) {
  max-width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 10px;
  gap: 10px;
}

.modal-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #e6f0ff;
  color: #718096;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.3s ease;
  padding: 0.75rem 1.25rem;
  min-height: 44px;
  touch-action: manipulation;
  text-align: center;
}

.modal-button:hover {
  background: linear-gradient(135deg, #003366 0%, #003366 100%);
  color: white;
}

.modal-button:active {
  transform: scale(0.98);
}

.modal-button span {
  font-family: var(--font-sora);
  font-size: 0.875rem;
  font-weight: 600;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  text-align: center;
  line-height: 1.4;
}

.modal-button svg {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.75rem;
    align-items: center;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  
  .modal-card {
    max-width: 100%;
    margin: 0;
    width: calc(100% - 1.5rem);
    height: fit-content;
    max-height: calc(100vh - 2rem);
  }
  
  .modal-close {
    top: 0.75rem;
    right: 0.75rem;
    width: 44px;
    height: 44px;
  }
  
  .modal-body-wrapper {
    padding: 0;
    height: auto;
    flex: 0 1 auto;
  }
  
  .modal-content {
    gap: 1rem;
    flex: 0 1 auto;
  }
  
  .modal-title {
    font-size: 1.5rem !important;
    line-height: 1.4 !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .modal-body {
    font-size: 1rem;
    line-height: 1.6;
  }
  
  .modal-body :deep(p) {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 0.75rem;
  }
  
  .modal-footer {
    padding-top: 0.75rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
    flex: 0 0 auto;
  }
  
  .modal-button {
    width: 100%;
    min-width: auto;
    justify-content: center;
    padding: 0.875rem 1rem;
    flex-wrap: wrap;
  }
  
  .modal-button span {
    font-size: 0.875rem;
    flex: 1 1 auto;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-card {
    width: calc(100% - 1rem);
    max-height: calc(100vh - 1rem);
  }
  
  .modal-close {
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .modal-title {
    font-size: 1.25rem !important;
  }
  
  .modal-body {
    font-size: 0.9375rem;
  }
  
  .modal-body :deep(p) {
    font-size: 0.9375rem;
  }
  
  .modal-button {
    padding: 0.75rem 0.875rem;
  }
  
  .modal-button span {
    font-size: 0.8125rem;
  }
}
</style>
