<template>
  <div class="share-widget">
    <div class="share-widget__icons">
      <a 
        :href="getShareUrl('x')" 
        target="_blank" 
        rel="noopener noreferrer"
        class="share-widget__icon-link"
      >
        <img src="/images/x.svg" alt="Share on X" class="share-widget__icon" />
      </a>
      <a 
        :href="getShareUrl('facebook')" 
        target="_blank" 
        rel="noopener noreferrer"
        class="share-widget__icon-link"
      >
        <img src="/images/facebook.svg" alt="Share on Facebook" class="share-widget__icon" />
      </a>
      <a 
        :href="getShareUrl('linkedin')" 
        target="_blank" 
        rel="noopener noreferrer"
        class="share-widget__icon-link"
      >
        <img src="/images/linkedin.svg" alt="Share on LinkedIn" class="share-widget__icon" />
      </a>
      <a 
        :href="getShareUrl('bluesky')" 
        target="_blank" 
        rel="noopener noreferrer"
        class="share-widget__icon-link"
      >
        <img src="/images/bluesky.svg" alt="Share on Bluesky" class="share-widget__icon" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface ShareWidgetProps {
  url?: string;
  title?: string;
  description?: string;
  align?: string;
  slug?: string; // Add slug property
}

const route = useRoute();
const props = withDefaults(defineProps<ShareWidgetProps>(), {
  url: '',
  title: '',
  description: '',
  align: 'left',
  slug: '', // Default to empty string
});

// Compute the actual URL to share
const actualUrl = computed(() => {
  // If a specific URL is provided, use it
  if (props.url && props.url !== 'https://rebootdemocracy.ai/blog/your-post-slug') {
    return props.url;
  }

  // Otherwise, build it from current route or slug
  const baseUrl = 'https://rebootdemocracy.ai/blog/';
  const slug = props.slug || (route.params.slug as string) || '';
  
  return baseUrl + slug;
});

// Compute the actual title to share
const actualTitle = computed(() => {
  if (props.title && props.title !== 'Your post title') {
    return props.title;
  }

  // Safe check: Only access document if it exists
  if (typeof document !== 'undefined') {
    return document.title || 'Reboot Democracy Article';
  }

  // During SSR, fallback to a default title
  return 'Reboot Democracy Article';
});


const getShareUrl = (platform: string) => {
  const encodedUrl = encodeURIComponent(actualUrl.value);
  const encodedTitle = encodeURIComponent(actualTitle.value);

  switch (platform) {
    case 'x':
      return `http://twitter.com/share?url=${encodedUrl}&text=${encodedTitle}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://linkedin.com/shareArticle?url=${encodedUrl}&title=${encodedTitle}`;
    case 'bluesky':
      return `https://bsky.app/intent/compose?text=${encodedUrl}`;
    default:
      return '#';
  }
};
</script>