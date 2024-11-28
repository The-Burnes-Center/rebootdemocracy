<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import { Directus } from '@directus/sdk';
import { useHead } from '@vueuse/head';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';

// Import other components and helpers as needed

const route = useRoute();
const directus = new Directus('https://content.thegovlab.com/');

const slug = ref(route.params.slug as string);
const post = ref(null);
const showModal = ref(false);
const modalData = ref([]);

async function fetchPost(slugValue: string) {
  try {
    const response = await directus.items('reboot_democracy_blog').readByQuery({
      filter: { slug: slugValue },
      fields: ['*.*.*'], // Adjust fields as necessary
      limit: 1,
    });

    if (!response.data || response.data.length === 0) {
      console.error('No post data found for slug:', slugValue);
      return null;
    }

    console.log('Post data:', response.data[0]);
    return response.data[0];
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Use top-level await to fetch the post


// Set meta tags
function setMetaTags(postData) {
  if (!postData) {
    // Set default meta tags
    const defaultDescription = `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another

As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`;

    useHead({
      title: 'RebootDemocracy.AI',
      meta: [
        { name: 'description', content: defaultDescription },
        { property: 'og:title', content: 'RebootDemocracy.AI' },
        { property: 'og:description', content: defaultDescription },
        {
          property: 'og:image',
          content: 'https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b',
        },
        { property: 'twitter:title', content: 'RebootDemocracy.AI' },
        { property: 'twitter:description', content: defaultDescription },
        {
          property: 'twitter:image',
          content: 'https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b',
        },
        { property: 'twitter:card', content: 'summary_large_image' },
      ],
    });
  } else {
    // Convert HTML content to plain text
    const htmlToText = (htmlContent: string): string => {
      // Use an appropriate method to strip HTML tags during SSR
      return htmlContent.replace(/<[^>]*>?/gm, '');
    };

    const description =
      postData.excerpt !== ''
        ? postData.excerpt
        : (htmlToText(postData.content).substring(0, 200) ?? '') + '...';

    const imageUrl = postData.image
      ? `${directus._url}assets/${postData.image.filename_disk}`
      : `${directus._url}assets/4650f4e2-6cc2-407b-ab01-b74be4838235`;

    useHead({
      title: `RebootDemocracy.AI Blog | ${postData.title}`,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: `RebootDemocracy.AI Blog | ${postData.title}` },
        { property: 'og:description', content: description },
        { property: 'og:image', content: imageUrl },
        { property: 'og:image:width', content: '800' },
        { property: 'og:image:height', content: '800' },
        { property: 'twitter:title', content: `RebootDemocracy.AI Blog | ${postData.title}` },
        { property: 'twitter:description', content: description },
        { property: 'twitter:image', content: imageUrl },
        { property: 'twitter:card', content: 'summary_large_image' },
      ],
    });
  }
}

// Set initial meta tags
setMetaTags(post.value);

// Formatting functions
function formatTimeOnly(d1: Date | string): string {
  return format(new Date(d1), 'h:mm aa');
}

function formatDateTime(d1: Date | string): string {
  return format(new Date(d1), 'MMMM d, yyyy, h:mm aa');
}

function formatDateOnly(d1: Date | string): string {
  return format(new Date(d1), 'MMMM d, yyyy');
}

function PastDate(d1: Date | string): boolean {
  return isPast(new Date(d1));
}

// Handle client-side navigation
onBeforeRouteUpdate(async (to, from, next) => {
  const newSlug = to.params.slug as string;
  post.value = await fetchPost(newSlug);

  // Update meta tags
  setMetaTags(post.value);

  next();
});

// Fetch the post data when the component is mounted
onMounted(async () => {
  post.value = await fetchPost(slug.value);

  // Set meta tags after post data is fetched
  setMetaTags(post.value);

  // Load modal data if needed
  await loadModal();
});

// Handle client-side navigation
onBeforeRouteUpdate(async (to, from, next) => {
  const newSlug = to.params.slug as string;
  post.value = await fetchPost(newSlug);

  // Update meta tags
  setMetaTags(post.value);

  next();
});



// Load modal data
async function loadModal() {
  try {
    const response = await directus.items('reboot_democracy_modal').readByQuery({
      meta: 'total_count',
      limit: -1,
      fields: ['*.*'],
    });

    modalData.value = response.data;

    if (typeof window !== 'undefined') {
      const storageItem = localStorage.getItem('Reboot Democracy');
      showModal.value =
        modalData.value.status === 'published' &&
        (modalData.value.visibility === 'always' ||
          (modalData.value.visibility === 'once' && storageItem !== 'off'));
    }
  } catch (error) {
    console.error('Error loading modal data:', error);
  }
}

function closeModal() {
  showModal.value = false;
  if (typeof window !== 'undefined') {
    localStorage.setItem('Reboot Democracy', 'off');
  }
}

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