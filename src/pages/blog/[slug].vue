<!-- src/pages/blog/[slug].vue -->
<!-- src/pages/blog/[slug].vue -->
<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useHead } from '@unhead/vue';
import { useRoute, useRouter } from 'vue-router';
import { createDirectus, rest, readItems } from '@directus/sdk';
import HeaderComponent from "../../components/header.vue";
import FooterComponent from "../../components/footer.vue";
import format from "date-fns/format";
import isPast from "date-fns/isPast";


// Get props provided by vite-plugin-pages for the dynamic route
const props = defineProps<{ slug: string }>();

// Normalize the slug to lowercase
const normalizedSlug = props.slug.toLowerCase();

const directus = createDirectus('https://content.thegovlab.com').with(rest());
const post = ref<any>(null);

// Date formatting functions...
function formatTimeOnly(d1) {
  return format(d1, "h:mm aa");
}
function formatDateTime(d1) {
  return format(d1, "MMMM d, yyyy, h:mm aa");
}
function formatDateOnly(d1) {
  return format(d1, "MMMM d, yyyy");
}
function PastDate(d1) {
  return isPast(d1);
}

async function fetchPost(slugValue: string) {
  if (!slugValue) return null;
  
  // Use a case-insensitive filter to fetch the post
  const response = await directus.request(
    readItems('reboot_democracy_blog', {
      filter: { 
        status: { _eq: 'published' },
        slug: { _icontains: slugValue } // Use case-insensitive equality
      },
      fields: ['*.*.*.*'],
      limit: -1,
    })
  );
  
  const data = response.data || response;
  return (Array.isArray(data) && data.length > 0) ? data[0] : null;
}

// If we're in SSG mode, fetch data before rendering
if (import.meta.env.SSR) {
  // Note: This is top-level await in script setup, allowed in newer environments
  post.value = await fetchPost(normalizedSlug);

  

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
            ? '/assets/' + post.value.image.filename_disk
            : '/meta-fallback-image.png',
        },
        { property: 'og:image:width', content: '800' },
        { property: 'og:image:height', content: '800' },
        { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
        { property: 'twitter:description', content: post.value.excerpt },
        {
          property: 'twitter:image',
          content: post.value.image
            ? '/assets/' + post.value.image.filename_disk
            : '/meta-fallback-image.png',
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
    console.log('Dev mode: fetching on mount for slug:', normalizedSlug);
    // post.value = await fetchPost(normalizedSlug);
    if (!post.value) {
      post.value = await fetchPost(normalizedSlug);
    }
    
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
              ? '/assets/' + post.value.image.filename_disk
              : '/meta-fallback-image.png',
          },
          { property: 'og:image:width', content: '800' },
          { property: 'og:image:height', content: '800' },
          { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
          { property: 'twitter:description', content: post.value.excerpt },
          {
            property: 'twitter:image',
            content: post.value.image
              ? '/assets/' + post.value.image.filename_disk
              : '/meta-fallback-image.png',
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
  <div v-if="post">
<!-- Header Component -->
<HeaderComponent></HeaderComponent>

<div class="blog-hero">

  <img v-if="post && post.image" class="blog-img" :src= "'/assets/'+post.image.filename_disk+'?width=800'" />
  
  <div class="blog-details">
    <h1>{{post.title}}</h1>
    <p class="excerpt"> {{post.excerpt}}</p>
    <p class="post-date">Published on <b>{{formatDateOnly(new Date(post.date))}}</b></p>

      <div class="hero-author-sm">
      <div v-for="(author,i) in post.authors">
          <div class="author-item">
            <img v-if="author.team_id.Headshot" class="author-headshot" :src="'/assets/'+author.team_id.Headshot.filename_disk">
            <p  v-if="!author.team_id.Headshot" class="author-no-image">{{author.team_id.First_Name[0] }} {{author.team_id.Last_Name[0]}}</p>
            <div class="author-details">
              <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
              <a class="author-bio" v-if="author.team_id.Link_to_bio" :href="author.team_id.Link_to_bio">Read Bio</a>
            </div>
          </div>
        </div>
        <div class="sm-tray">
          <a target="_blank" :href="'http://twitter.com/share?url=https://rebootdemocracy.ai/blog/' + post.slug"><i class="fa-brands fa-square-x-twitter"></i></a>
          <a target="_blank" :href="'https://www.facebook.com/sharer/sharer.php?u=https://rebootdemocracy.ai/blog/' + post.slug"><i class="fa-brands fa-facebook"></i></a>
          <a target="_blank" :href="'https://linkedin.com/shareArticle?url=https://rebootdemocracy.ai/blog/' + post.slug + '&title=' + post.title"><i class="fa-brands fa-linkedin"></i></a>
          <!-- <a><i class="fa-solid fa-link"></i></a> -->
        </div>

    </div>
   
  </div>
</div>

<div class="blog-body">
  <div class="audio-version" v-if="post.audio_version">
  <p dir="ltr"><em>Listen to the AI-generated audio version of this piece.&nbsp;</em></p>
    <p><audio controls="controls"><source :src="'/assets/'+post.audio_version.filename_disk" type="audio/mpeg" data-mce-fragment="1"></audio></p>
  </div>
    <div class="blog-content" v-html="post.content"></div>
    <p v-if="post.ai_content_disclaimer" class="blog-img-byline">Some images in this post were generated using AI.</p>
</div>

  <!-- Footer Component -->
  <FooterComponent></FooterComponent>
  
  <!-- Wrap content in a Suspense boundary in a parent component or layout -->
  

  </div>
  <div v-else>
    <p>Loading ...</p>
  </div>

</template>