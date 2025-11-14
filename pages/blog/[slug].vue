<template>
  <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
    <div v-if="blogLoading" style="padding: 2rem; text-align: center;">
      <p>Loading blog post...</p>
    </div>

    <div v-else-if="blogError" style="padding: 2rem; background: #ffebee; border-radius: 8px; color: #c62828;">
      <h2>Error loading blog post</h2>
      <p>{{ blogError }}</p>
    </div>

    <article v-else-if="blogPost" style="max-width: 800px; margin: 0 auto;">
      <!-- Blog Post Header -->
      <header style="margin-bottom: 2rem;">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; line-height: 1.2;">
          {{ blogPost.title }}
        </h1>
        
        <div v-if="blogPost.excerpt" style="font-size: 1.2rem; color: #666; margin-bottom: 1rem; font-style: italic;">
          {{ blogPost.excerpt }}
        </div>

        <div style="display: flex; gap: 1rem; color: #888; font-size: 0.9rem; margin-top: 1rem;">
          <span v-if="blogPost.date">
            Published: {{ formatDate(blogPost.date) }}
          </span>
          <span v-if="blogPost.date_updated && blogPost.date_updated !== blogPost.date">
            Updated: {{ formatDate(blogPost.date_updated) }}
          </span>
        </div>
      </header>

      <!-- Blog Post Content -->
      <div 
        v-if="blogPost.content" 
        v-html="blogPost.content" 
        style="line-height: 1.8; font-size: 1.1rem;"
        class="blog-content"
      ></div>

      <!-- Blog Post Meta Information -->
      <footer style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e0e0e0;">
        <div v-if="blogPost.Tags && blogPost.Tags.length > 0" style="margin-bottom: 1rem;">
          <strong>Tags:</strong>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
            <span 
              v-for="tag in blogPost.Tags" 
              :key="tag"
              style="background: #f0f0f0; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.9rem;"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div style="color: #888; font-size: 0.9rem;">
          <p v-if="blogPost.fullURL">
            <strong>URL:</strong> 
            <a :href="blogPost.fullURL" target="_blank" rel="noopener">{{ blogPost.fullURL }}</a>
          </p>
        </div>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
/**
 * Blog Post Page Component
 * 
 * This page displays a blog post fetched from Directus based on the slug parameter.
 * It uses ISR (Incremental Static Regeneration) to cache the page and only regenerate
 * when the cache is purged via the /api/revalidate endpoint.
 * 
 * How it works:
 * 1. Extracts slug from route params (e.g., /blog/my-post-slug)
 * 2. Fetches blog post from Directus API filtering by slug
 * 3. Displays the blog post content with all metadata
 * 4. Page is cached with tag "blog/{slug}" for on-demand revalidation
 * 
 * Cache Tag:
 * - Set via server plugin (server/plugins/cache-tag.ts)
 * - Format: "blog/{slug}" (e.g., "blog/my-post-slug")
 * - Allows on-demand cache invalidation by tag
 * 
 * Directus API:
 * - Endpoint: https://directus.theburnescenter.org/items/reboot_democracy_blog/
 * - Filter: ?filter[slug][_eq]={slug}
 * - Returns: Array of blog posts matching the slug
 */

// Get slug from route params
const route = useRoute()
const slug = route.params.slug as string

if (!slug) {
  throw createError({
    statusCode: 400,
    statusMessage: "Missing slug parameter",
  })
}

/**
 * Fetch Blog Post from Directus
 * 
 * Fetches the blog post from Directus API filtering by slug.
 * This happens during SSR and the data is embedded in the cached page.
 * 
 * Important: This fetch happens during SSR, so the data is part
 * of the cached HTML. When the page is regenerated after cache purge,
 * this API is called again and fresh content is fetched.
 */
const { data: blogPost, pending: blogLoading, error: blogError } = await useFetch(
  `https://directus.theburnescenter.org/items/reboot_democracy_blog/`,
  {
    key: `blog-post-${slug}`, // Unique key per slug ensures correct caching
    server: true, // Ensure it runs on server during SSR
    query: {
      'filter[slug][_eq]': slug, // Filter by slug
      fields: [
        'id',
        'title',
        'slug',
        'content',
        'excerpt',
        'image', // Image field (will be UUID string or object)
        'date',
        'Tags',
        'fullURL',
        'one_line',
      ].join(','), // Only request essential fields
    },
    transform: (data: any) => {
      // Directus returns an array, get the first matching post
      const posts = data?.data || []
      if (posts.length === 0) {
        return null
      }
      return posts[0] // Return the first (and should be only) matching post
    },
  }
)

// Handle 404 if blog post not found
if (!blogLoading.value && !blogPost.value && !blogError.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Blog post with slug "${slug}" not found`,
  })
}

/**
 * Format Date Helper
 * 
 * Formats ISO date strings into readable format.
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

/**
 * Set Comprehensive Meta Tags from Blog Post Data
 * 
 * Sets all SEO and social media meta tags from the blog post data:
 * - Basic SEO (title, description)
 * - Open Graph tags (for Facebook, LinkedIn, etc.)
 * - Twitter Card tags
 * - Article meta tags (published date, authors, tags)
 * - Canonical URL
 */
useHead(() => {
  if (!blogPost.value) {
    return {
      title: 'Blog Post',
    }
  }

  const post = blogPost.value
  const siteUrl = 'https://rebootdemocracy.ai' // Update with your actual site URL
  const currentUrl = post.fullURL || `${siteUrl}/blog/${post.slug}`
  
  // Construct image URL from Directus file ID
  // Directus file URLs format: https://directus.theburnescenter.org/assets/{file-id}
  // The image field might be a string UUID or an object with an id field
  let imageId: string | null = null
  if (post.image) {
    if (typeof post.image === 'string') {
      imageId = post.image
    } else if (post.image.id) {
      imageId = post.image.id
    }
  }
  const imageUrl = imageId 
    ? `https://directus.theburnescenter.org/assets/${imageId}`
    : null
  
  // Get description (prefer excerpt, fallback to one_line)
  const description = post.excerpt || post.one_line || ''

  return {
    title: post.title || 'Blog Post',
    meta: [
      // Basic SEO
      {
        name: 'description',
        content: description,
      },
      
      // Open Graph / Facebook
      {
        property: 'og:type',
        content: 'article',
      },
      {
        property: 'og:title',
        content: post.title || 'Blog Post',
      },
      {
        property: 'og:description',
        content: description,
      },
      {
        property: 'og:url',
        content: currentUrl,
      },
      ...(imageUrl ? [
        {
          property: 'og:image',
          content: imageUrl,
        },
        {
          property: 'og:image:secure_url',
          content: imageUrl,
        },
        {
          property: 'og:image:type',
          content: 'image/jpeg', // Adjust if needed
        },
      ] : []),
      {
        property: 'og:site_name',
        content: 'Reboot Democracy',
      },
      
      // Twitter Card
      {
        name: 'twitter:card',
        content: imageUrl ? 'summary_large_image' : 'summary',
      },
      {
        name: 'twitter:title',
        content: post.title || 'Blog Post',
      },
      {
        name: 'twitter:description',
        content: description,
      },
      ...(imageUrl ? [
        {
          name: 'twitter:image',
          content: imageUrl,
        },
      ] : []),
      
      // Article meta tags
      ...(post.date ? [
        {
          property: 'article:published_time',
          content: new Date(post.date).toISOString(),
        },
      ] : []),
      ...(post.date_updated && post.date_updated !== post.date ? [
        {
          property: 'article:modified_time',
          content: new Date(post.date_updated).toISOString(),
        },
      ] : []),
      ...(post.Tags && Array.isArray(post.Tags) && post.Tags.length > 0 ? 
        post.Tags.map((tag: string) => ({
          property: 'article:tag',
          content: tag,
        }))
      : []),
    ],
    link: [
      // Canonical URL
      {
        rel: 'canonical',
        href: currentUrl,
      },
    ],
  }
})
</script>

<style scoped>
.blog-content :deep(h1),
.blog-content :deep(h2),
.blog-content :deep(h3),
.blog-content :deep(h4),
.blog-content :deep(h5),
.blog-content :deep(h6) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.blog-content :deep(p) {
  margin-bottom: 1.5rem;
}

.blog-content :deep(a) {
  color: #0d63eb;
  text-decoration: underline;
}

.blog-content :deep(a:hover) {
  color: #0a4fc2;
}

.blog-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2rem 0;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  margin: 1.5rem 0;
  padding-left: 2rem;
}

.blog-content :deep(li) {
  margin-bottom: 0.5rem;
}

.blog-content :deep(blockquote) {
  border-left: 4px solid #0d63eb;
  padding-left: 1.5rem;
  margin: 2rem 0;
  font-style: italic;
  color: #666;
}
</style>

