<script setup lang="ts">
import { defineAsyncComponent, hydrateOnInteraction } from 'vue';

// The Deferred API component will not be hydrated until a click is received.
// For SSR, fetch data before rendering.
// let DeferredApiComp = {}
// if (import.meta.env.SSR) {
   const DeferredApiComp = defineAsyncComponent({
  loader: () => import('../components/DeferredApiComponent.vue'),
  hydrate: hydrateOnInteraction('click'),
});
// }

</script>

<template>
  <div>
    <!-- The static HTML here will render the DeferredApiComponent's markup.
         When you click anywhere inside it, hydration is triggered, which then calls the API. -->
    <DeferredApiComp />
  </div>
</template>