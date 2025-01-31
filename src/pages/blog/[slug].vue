
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { createDirectus, rest, readItems } from '@directus/sdk'

// Example: import any shared components
import HeaderComponent from '../../components/header.vue'
import FooterComponent from '../../components/footer.vue'

// In VitePress-based or Vite-based SSG, we'll receive "slug" as a prop from file-based routing
const props = defineProps<{ slug: string }>()

/**
 * This ref holds our loaded post data from Directus.
 * If it's null, we either haven't fetched yet or there's no post matching the slug.
 */
const post = ref<any>(null)

/**
 * Create the Directus REST client. 
 * Replace "https://content.thegovlab.com" with your own Directus instance if needed.
 */
const directus = createDirectus('https://content.thegovlab.com').with(rest())

/**
 * Utility fetch function to load the blog post associated with slugValue.
 * (Case-insensitive match for "published" post.)
 */
async function fetchPost(slugValue: string) {
  if (!slugValue) return null

  const response = await directus.request(
    readItems('reboot_democracy_blog', {
      filter: {
        status: { _eq: 'published' },
        slug: { _icontains: slugValue },
      },
      fields: ['*.*.*.*'], // Adjust the fields if you need nested expansions
      limit: -1,
    })
  )

  // Directus returns data in "response.data" or directly in "response"
  const data = response.data || response
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

// --------------------
// SSG / SSR fetch block
// This portion runs at build-time or server-time.
// It populates "post" so the static HTML includes the correct content.
// --------------------
if (import.meta.env.SSR) {
console.log("SSR fetching post for slug:", props.slug)
post.value = await fetchPost(props.slug)
console.log("SSR fetch result:", post.value)

  if (post.value) {
    // Inject meta tags for SEO and social sharing
    useHead({
      title: `RebootDemocracy.AI Blog | ${post.value.title}`,
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
    })
  } else {
    // If there's no matching post, set a "Not found" meta
    useHead({
      title: 'Post Not Found',
      meta: [
        { name: 'description', content: 'No post found for this slug.' },
      ],
    })
  }
// } else {
//   // --------------------
//   // Client code (runs in the browser after hydration)
//   // If you don't want to do any client re-fetch in production, gate it behind import.meta.env.DEV
//   // --------------------
//   console.log("Client: import.meta.env.DEV =", import.meta.env.DEV);
//   onMounted(async () => {
//     // Example: Only do a second fetch in dev mode for local debugging
//     if (import.meta.env.DEV) {
//       console.log('Dev mode: fetching on mount for slug:', props.slug)
//       post.value = await fetchPost(props.slug)

//       // Update meta if we get the post in dev mode
//       if (post.value) {
//         useHead({
//           title: `RebootDemocracy.AI Blog | ${post.value.title}`,
//           meta: [
//         { name: 'title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
//         { name: 'description', content: post.value.excerpt },
//         { property: 'og:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
//         { property: 'og:description', content: post.value.excerpt },
//         {
//           property: 'og:image',
//           content: post.value.image
//             ? '/assets/' + post.value.image.filename_disk
//             : '/meta-fallback-image.png',
//         },
//         { property: 'og:image:width', content: '800' },
//         { property: 'og:image:height', content: '800' },
//         { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.value.title },
//         { property: 'twitter:description', content: post.value.excerpt },
//         {
//           property: 'twitter:image',
//           content: post.value.image
//             ? '/assets/' + post.value.image.filename_disk
//             : '/meta-fallback-image.png',
//         },
//         { property: 'twitter:card', content: 'summary_large_image' },
//       ],
//         })
//       } else {
//         useHead({
//           title: 'Post Not Found',
//           meta: [{ name: 'description', content: 'No post found for this slug.' }],
//         })
//       }
  //   }
  // })
}
</script>

<template>
  <!-- If we have post data, show it. If not, show a fallback. -->
  <div v-if="post && import.meta.env.SSR">
    <!-- Example: a header component -->
    <HeaderComponent />

    <!-- Example hero section with a featured image -->
    <section class="blog-hero">
      <img
        v-if="post.image"
        class="blog-img"
        :src="`/assets/${post.image.filename_disk}?width=800`"
        alt="Blog Post Image"
      />
      <div class="blog-details">
        <h1>{{ post.title }}</h1>
        <p class="excerpt">{{ post.excerpt }}</p>
      </div>
    </section>

    <!-- Body of the blog post, using v-html to render any HTML content -->
    <section class="blog-body">
      <!-- If "post.content" is HTML from Directus, you can render it directly -->
      <div class="blog-content" v-html="post.content"></div>
      
      <!-- Optional disclaimers or notes -->
      <p v-if="post.ai_content_disclaimer" class="blog-img-byline">
        Some images in this post were generated using AI.
      </p>
    </section>

    <!-- Example: a footer component -->
    <FooterComponent />
  </div>

  <!-- Fallback if "post" is null. 
       In production, if the SSR/SSG fetch succeeded, this won't be seen. -->
  <div v-else>
    <p>Loading...</p>
  </div>
</template>

<style scoped>
.blog-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* add styling as needed */
}
.blog-img {
  width: 100%;
  max-width: 800px;
  margin-bottom: 1rem;
}
.blog-details {
  text-align: center;
}
.blog-body {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.blog-content {
  margin-top: 1rem;
}
.blog-img-byline {
  font-style: italic;
  margin-top: 1rem;
}
</style>


