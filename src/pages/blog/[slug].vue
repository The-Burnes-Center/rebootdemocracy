<!-- src/pages/blog/[slug].vue -->
<script setup lang="ts">
import { ref, onServerPrefetch, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { createDirectus, rest, readItems } from '@directus/sdk';

// Define props
defineProps<{ slug: string }>();

const route = useRoute();
const slug = ref(route.params.slug || '');

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

function setMetaTags(post) {
  useHead({
    title: 'RebootDemocracy.AI Blog | ' + post.title,
    meta: [
      { name: 'title', content: 'RebootDemocracy.AI Blog | ' + post.title },
      { name: 'description', content: post.excerpt },
      { property: 'og:title', content: 'RebootDemocracy.AI Blog | ' + post.title },
      { property: 'og:description', content: post.excerpt },
      {
        property: 'og:image',
        content: post.image
          ? 'https://content.thegovlab.com/assets/' + post.image.filename_disk
          : 'https://content.thegovlab.com/assets/' + '4650f4e2-6cc2-407b-ab01-b74be4838235',
      },
      { property: 'og:image:width', content: '800' },
      { property: 'og:image:height', content: '800' },
      { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.title },
      { property: 'twitter:description', content: post.excerpt },
      {
        property: 'twitter:image',
        content: post.image
          ? 'https://content.thegovlab.com/assets/' + post.image.filename_disk
          : 'https://content.thegovlab.com/assets/' + '4650f4e2-6cc2-407b-ab01-b74be4838235',
      },
      { property: 'twitter:card', content: 'summary_large_image' },

    ],
  });
}

async function fetchAndSetPost(slugValue) {
  post.value = await fetchPost(slugValue);
  if (post.value) {
    setMetaTags(post.value);
  }
}

// Fetch data during SSR
onServerPrefetch(() => {
  return fetchAndSetPost(slug.value);
});

// Fetch data on client-side navigation
onMounted(() => {
  if (!post.value) {
    fetchAndSetPost(slug.value);
  }
});

// Watch for route changes (for client-side navigation)
watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug !== slug.value) {
      slug.value = newSlug;
      fetchAndSetPost(slug.value);
    }
  }
);
</script>

<template>
  <div>
    <div v-if="post">
      <h1>{{ post.title }}</h1>
      <div v-html="post.content"></div>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>