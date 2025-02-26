<template>
    <div v-if="post">
      <!-- Blog Hero Section -->
      <div class="blog-hero">
        <img
          v-if="post.image"
          class="blog-img"
          :src="ASSET_BASE_URL + post.image.filename_disk + '?width=800'"
          alt="Blog header image"
        />
        <div class="blog-details">
          <h1>{{ post.title }}</h1>
          <p class="excerpt">{{ post.excerpt }}</p>
          <p class="post-date">
            Published on <b>{{ formatDateOnly(new Date(post.date)) }}</b>
          </p>
          <div class="sm-tray">
            <a
              target="_blank"
              :href="'http://twitter.com/share?url=https://test.cm/blog/' + post.slug"
            >
              <i class="fa-brands fa-square-x-twitter"></i>
            </a>
            <a
              target="_blank"
              :href="'https://www.facebook.com/sharer/sharer.php?u=https://test.cm/blog/' + post.slug"
            >
              <i class="fa-brands fa-facebook"></i>
            </a>
            <a
              target="_blank"
              :href="'https://linkedin.com/shareArticle?url=https://test.cm/blog/' + post.slug + '&title=' + post.title"
            >
              <i class="fa-brands fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
  
      <!-- Blog Body -->
      <div class="blog-body">
        <div class="blog-content" v-html="post.content"></div>
        <p v-if="post.ai_content_disclaimer" class="blog-img-byline">
          Some images in this post were generated using AI.
        </p>
      </div>
    </div>
    <div v-else>
      <p>Loading ...</p>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { useRoute } from 'vue-router'
  import { useHead } from '#imports'
  import { createDirectus, rest, readItems } from '@directus/sdk'
  import { useAsyncData } from '#imports'
  import format from 'date-fns/format'
  import isPast from 'date-fns/isPast'
  

  // Date formatting helpers.
  function formatDateOnly(d1: Date): string {
    return format(d1, 'MMMM d, yyyy')
  }
  function formatDateTime(d1: Date): string {
    return format(d1, 'MMMM d, yyyy, h:mm aa')
  }
  function PastDate(d1: Date): boolean {
    return isPast(d1)
  }
  
  // Fetch a single post by slug.
  // Asset configuration.
  const ASSET_BASE_URL = import.meta.env.DEV
    ? 'https://dev.thegovlab.com/assets/'
    : 'https://ssg-test.rebootdemocracy.ai/assets/'
  const FALLBACK_IMAGE_ID = '4650f4e2-6cc2-407b-ab01-b74be4838235'
  
  // Get slug from route params.
  const route = useRoute()
  const slugParam = route.params.slug
  if (!slugParam) {
    throw new Error('No slug provided in URL.')
  }
  const normalizedSlug = String(slugParam).toLowerCase()
  
  const directus = createDirectus('https://dev.thegovlab.com').with(rest())
  
  // Function to fetch a single post.
  async function fetchPost(slugValue: string) {
    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        filter: {
          status: { _eq: 'published' },
          slug: { _icontains: slugValue }
        },
        fields: ['*.*.*'],
        limit: -1
      })
    )
    const data = response.data || response
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  }
  
  // Use Nuxt's async data fetching.
  // With { server: true }, this runs on the server and its result is embedded in the payload.
  const { data: post, error } = await useAsyncData('post', () => fetchPost(normalizedSlug), {
    server: true
  })
  
  // Dynamically set meta tags based on the fetched post.
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
            ? `${ASSET_BASE_URL}${post.value.image.filename_disk}`
            : `${ASSET_BASE_URL}${FALLBACK_IMAGE_ID}`
        },
        { property: 'og:image:width', content: '800' },
        { property: 'og:image:height', content: '800' },
        { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
        { property: 'twitter:description', content: post.value.excerpt },
        {
          property: 'twitter:image',
          content: post.value.image
            ? `${ASSET_BASE_URL}${post.value.image.filename_disk}`
            : `${ASSET_BASE_URL}${FALLBACK_IMAGE_ID}`
        },
        { property: 'twitter:card', content: 'summary_large_image' }
      ]
    })
  } else {
    useHead({
      title: 'Post Not Found',
      meta: [{ name: 'description', content: 'The requested post could not be found.' }]
    })
  }
  </script>
  
  <style scoped>
  .blog-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }
  .blog-img {
    width: 100%;
    max-width: 800px;
    object-fit: cover;
    margin-bottom: 1rem;
  }
  .blog-details {
    text-align: center;
  }
  .sm-tray a {
    margin: 0 0.5rem;
    color: #555;
    font-size: 1.5rem;
  }
  .blog-body {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }
  </style>
  