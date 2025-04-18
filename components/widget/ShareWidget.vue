<template>
  <div class="share-widget">
    <Text
      as="p"
      size="base"
      weight="bold"
      class="share-widget__text"
      :align="align"
    >
      Share
    </Text>
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
interface ShareWidgetProps {
  url?: string;
  title?: string;
  description?: string;
  align?: string;
}

const props = withDefaults(defineProps<ShareWidgetProps>(), {
  url: window.location.href,
  title: document.title,
  description: '',
  align: 'left',
});

const getShareUrl = (platform: string) => {
  const encodedUrl = encodeURIComponent(props.url);
  const encodedTitle = encodeURIComponent(props.title);
  const encodedDescription = encodeURIComponent(props.description);

  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'bluesky':
      // Bluesky doesn't have a standard sharing URL yet, so we'll create a text to share
      return `https://bsky.app/intent?text=${encodedTitle}%20${encodedUrl}`;
    default:
      return '#';
  }
};
</script>