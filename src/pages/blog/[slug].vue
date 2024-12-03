<!-- src/pages/blog/[slug].vue -->
<script lang="ts" setup>
import { ref } from 'vue';
import { useHead } from '@unhead/vue';
import { createDirectus, rest, readItems } from '@directus/sdk';

// Define props to get the slug from the route
const props = defineProps<{ slug: string }>();

const directus = createDirectus('https://content.thegovlab.com').with(rest());

const post = ref(null);

async function fetchPost(slugValue) {
  console.log('Fetching post for slug:', slugValue);

  try {
    if (!slugValue) {
      console.error('Slug is undefined or empty');
      return null;
    }

    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        filter: { slug: slugValue },
        fields: ['*.*.*'],
        limit: 1,
      })
    );

    const data = response.data ? response.data : response;

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    } else {
      console.error('No post found for slug:', slugValue);
      return null;
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Fetch the post data using top-level await
post.value = await fetchPost(props.slug);

if (post.value) {
  // Set meta tags using useHead
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
          : 'https://content.thegovlab.com/assets/' + '4650f4e2-6cc2-407b-ab01-b74be4838235',
      },
      { property: 'og:image:width', content: '800' },
      { property: 'og:image:height', content: '800' },
      { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
      { property: 'twitter:description', content: post.value.excerpt },
      {
        property: 'twitter:image',
        content: post.value.image
          ? 'https://content.thegovlab.com/assets/' + post.value.image.filename_disk
          : 'https://content.thegovlab.com/assets/' + '4650f4e2-6cc2-407b-ab01-b74be4838235',
      },
      { property: 'twitter:card', content: 'summary_large_image' },
    ],
  });
} else {
  // Handle the case where the post is not found
  useHead({
    title: 'Post Not Found',
    meta: [
      { name: 'description', content: 'The requested post could not be found.' },
    ],
  });
}
</script>

<template>
  <div>
    <div v-if="post">
      <h1>{{ post.title }}</h1>
      <div v-html="post.content"></div>
    </div>
    <div v-else>
      <p>Post not found.</p>
    </div>
  </div>
</template>