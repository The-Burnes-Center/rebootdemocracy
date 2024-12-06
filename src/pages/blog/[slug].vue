<!-- src/pages/blog/[slug].vue -->
<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useHead } from '@unhead/vue';
import { createDirectus, rest, readItems } from '@directus/sdk';

// Get props provided by vite-plugin-pages for the dynamic route
const props = defineProps<{ slug: string }>();

const directus = createDirectus('https://content.thegovlab.com').with(rest());
const post = ref<any>(null);

async function fetchPost(slugValue: string) {
  if (!slugValue) return null;
  console.log('Fetching post:', slugValue);
  const response = await directus.request(
    readItems('reboot_democracy_blog', {
      filter: { slug: slugValue },
      fields: ['*.*.*'],
      limit: 1,
    })
  );
  
  const data = response.data || response;
  return (Array.isArray(data) && data.length > 0) ? data[0] : null;
}

// If we're in SSG mode, fetch data before rendering
if (import.meta.env.SSR) {
  // Note: This is top-level await in script setup, allowed in newer environments
  post.value = await fetchPost(props.slug);

  // Set meta right after data is fetched in SSG
  if (post.value) {
    useHead({
      title: 'RebootDemocracy.AI Blog | ' + post.value.title,
      meta: [
        { name: 'title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
        { name: 'description', content: post.value.excerpt },
        { property: 'og:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
        { property: 'og:description', content: post.value.excerpt },
        {
          property: 'og:image',
          content: post.value.image
            ? 'https://content.thegovlab.com/assets/' + post.value.image.filename_disk
            : 'https://content.thegovlab.com/assets/4650f4e2-6cc2-407b-ab01-b74be4838235',
        },
        { property: 'og:image:width', content: '800' },
        { property: 'og:image:height', content: '800' },
        { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
        { property: 'twitter:description', content: post.value.excerpt },
        {
          property: 'twitter:image',
          content: post.value.image
            ? 'https://content.thegovlab.com/assets/' + post.value.image.filename_disk
            : 'https://content.thegovlab.com/assets/4650f4e2-6cc2-407b-ab01-b74be4838235',
        },
        { property: 'twitter:card', content: 'summary_large_image' },
      ],
    });
  } else {
    useHead({
      title: 'Post Not Found',
      meta: [
        { name: 'description', content: 'The requested post could not be found.' },
      ],
    });
  }
} else {
  // In dev mode (no SSR), fetch data after mount
  onMounted(async () => {
    console.log('Dev mode: fetching on mount for slug:', props.slug);
    post.value = await fetchPost(props.slug);
    
    if (post.value) {
      useHead({
        title: 'RebootDemocracy.AI Blog | ' + post.value.title,
        meta: [
          { name: 'title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
          { name: 'description', content: post.value.excerpt },
          { property: 'og:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
          { property: 'og:description', content: post.value.excerpt },
          {
            property: 'og:image',
            content: post.value.image
              ? 'https://content.thegovlab.com/assets/' + post.value.image.filename_disk
              : 'https://content.thegovlab.com/assets/4650f4e2-6cc2-407b-ab01-b74be4838235',
          },
          { property: 'og:image:width', content: '800' },
          { property: 'og:image:height', content: '800' },
          { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
          { property: 'twitter:description', content: post.value.excerpt },
          {
            property: 'twitter:image',
            content: post.value.image
              ? 'https://content.thegovlab.com/assets/' + post.value.image.filename_disk
              : 'https://content.thegovlab.com/assets/4650f4e2-6cc2-407b-ab01-b74be4838235',
          },
          { property: 'twitter:card', content: 'summary_large_image' },
        ],
      });
    } else {
      useHead({
        title: 'Post Not Found',
        meta: [
          { name: 'description', content: 'The requested post could not be found.' },
        ],
      });
    }
  });
}
</script>

<template>

  <!-- Wrap content in a Suspense boundary in a parent component or layout -->
  <div v-if="post">
    <h1>{{ post.title }}</h1>
    <div v-html="post.content"></div>
  </div>
  <div v-else>
    <p>Loading or Post not found...</p>
  </div>

</template>
