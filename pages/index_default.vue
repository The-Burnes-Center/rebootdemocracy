<template>
    <div>
          <!-- Main Menu with Deferred Submenu -->
      <nav class="main-menu">
        <ul>
          <li
            @mouseenter="loadMenu"
            @mouseleave="hideMenu"
            class="menu-item"
          >
            <a href="#">Menu</a>
            <LazyHydrate v-if="menuLoaded" when-visible>
              <DeferredMenu />
            </LazyHydrate>
          </li>
        </ul>
      </nav>
  
      <hr />
      <h1>Static Page with Build-Time Data</h1>
      <!-- Build-time API data -->
      <div v-if="error">
        <p>Error loading data.</p>
      </div>
      <div v-else-if="data">
        <h2>{{ data.metaTitle }}</h2>
        <p><strong>ID:</strong> {{ data.id }}</p>
        <p><strong>Title:</strong> {{ data.title }}</p>
        <p><strong>Completed:</strong> {{ data.completed }}</p>
        <div v-if="data.image">
          <img :src="data.image" alt="Todo Item Image" />
        </div>
      </div>
      <div v-else>
        <p>Loading...</p>
      </div>
  
      <hr />
  
    
  
      <!-- Deferred component section -->
      <h2>Deferred Component: Client-Side API Call</h2>
      <div v-if="!deferredLoaded">
        <button @click="loadDeferred">Load Deferred Data</button>
      </div>
      <LazyHydrate v-else when-visible>
        <DeferredComponent />
      </LazyHydrate>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, watchEffect } from 'vue'
  import { useHead } from '#imports'
  import DeferredComponent from '~/components/DeferredComponent.vue'
  import DeferredMenu from '~/components/DeferredMenu.vue'
  
  // Build-time API call using useFetch.
  // This call runs during SSG so its result is embedded in the HTML.
  const { data, error } = await useFetch('https://jsonplaceholder.typicode.com/todos/1', {
    server: true,
  })
  
  // Simulate API returning extra meta fields.
  // In a real scenario these would be returned by your API.
  if (data.value) {
    data.value.metaTitle = `Todo: ${data.value.title}`
    data.value.metaDescription = `This is the todo item titled "${data.value.title}". Completed: ${data.value.completed}.`
    
    // Handle the image: in production (SSG) download and store it; in development, use the remote URL.
    const remoteImage = 'https://dev.thegovlab.com/assets/54d58fb7-e9d1-4165-b5d5-654bee33a479.webp'
    if (process.server && !process.dev) {
      // Import our server-only image downloader.
      const { downloadAndStoreImage } = await import('~/server/download-image')
      data.value.image = await downloadAndStoreImage(remoteImage)
    } else {
      data.value.image = remoteImage
    }
  }
  
  // Dynamically set meta tags using useHead. These meta tags will be part of the prerendered HTML.
  watchEffect(() => {
    if (data.value) {
      useHead({
        title: data.value.metaTitle,
        meta: [
          { name: 'description', content: data.value.metaDescription },
          { property: 'og:title', content: data.value.metaTitle },
          { property: 'og:description', content: data.value.metaDescription },
          { property: 'og:image', content: data.value.image },
          { property: 'og:type', content: 'website' },
          // Adjust the URL to your domain.
          { property: 'og:url', content: 'https://yourdomain.com' },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: data.value.metaTitle },
          { name: 'twitter:description', content: data.value.metaDescription },
          { name: 'twitter:image', content: data.value.image },
        ]
      })
    }
  })
  
  // Deferred component loading flag.
  const deferredLoaded = ref(false)
  function loadDeferred() {
    deferredLoaded.value = true
  }
  
  // Menu flag for deferred hydration.
  const menuLoaded = ref(false)
  function loadMenu() {
    menuLoaded.value = true
  }
  function hideMenu() {
    // Optionally unmount on mouse leave: menuLoaded.value = false
  }
  </script>
  
  <style scoped>
  .main-menu {
    margin: 2rem 0;
  }
  .menu-item {
    position: relative;
    display: inline-block;
  }
  .menu-item a {
    text-decoration: none;
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border-radius: 4px;
  }
  </style>
  