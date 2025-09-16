<template>
  <!-- Skip link for keyboard users -->
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <!-- Full-width purple gradient background -->
  <div class="blog-gradient-background">
    <div class="blog-gradient-inner">
      <section class="blog-section">
        <main id="main-content" class="left-content-blog" role="main">
          <div v-if="showSearchResults" role="search" aria-label="Search results">
            <GlobalSearch />
          </div>

          <!-- Loading state -->
          <template v-else>
            <div 
              v-if="isLoading" 
              class="loading"
              role="status"
              aria-live="polite"
              aria-label="Loading blog post"
            >
              <div class="loading-spinner" aria-hidden="true"></div>
              <Text size="base" weight="medium" align="center">
                <span class="sr-only">Loading blog post, please wait</span>
                Loading blog post...
              </Text>
            </div>

            <!-- Error state -->
            <div 
              v-else-if="!blog" 
              class="error-message"
              role="alert"
              aria-live="assertive"
            >
              <TitleText level="h1" size="xl" align="center">
                Blog post not found
              </TitleText>
              <p>The blog post you're looking for could not be found.</p>
              <Button 
                @click="router.push('/blog')" 
                @keydown="handleKeydown($event, () => router.push('/blog'))"
                variant="primary"
                aria-label="Return to blog listing page"
              >
                Back to Blogs
              </Button>
            </div>

            <!-- Blog top section -->
            <template v-else>
              <header class="blog-top-section">
                <!-- Back button with proper accessibility -->
                <nav aria-label="Breadcrumb navigation">
                  <button 
                    class="blog-back-btn" 
                    @click="router.push('/blog')"
                    @keydown="handleKeydown($event, () => router.push('/blog'))"
                    aria-label="Go back to blog listing"
                    type="button"
                  >
                    <!-- SVG icon with proper accessibility -->
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      class="icon"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        d="M15.7957 18.7041C16.0071 18.9154 16.1258 19.2021 16.1258 19.5009C16.1258 19.7998 16.0071 20.0865 15.7957 20.2978C15.5844 20.5092 15.2977 20.6279 14.9989 20.6279C14.7 20.6279 14.4133 20.5092 14.202 20.2978L6.70198 12.7978C6.5971 12.6933 6.51388 12.5691 6.4571 12.4324C6.40032 12.2956 6.37109 12.149 6.37109 12.0009C6.37109 11.8529 6.40032 11.7063 6.4571 11.5695C6.51388 11.4328 6.5971 11.3086 6.70198 11.2041L14.202 3.70406C14.4133 3.49272 14.7 3.37399 14.9989 3.37399C15.2977 3.37399 15.5844 3.49272 15.7957 3.70406C16.0071 3.91541 16.1258 4.20205 16.1258 4.50094C16.1258 4.79982 16.0071 5.08647 15.7957 5.29781L9.09354 12L15.7957 18.7041Z"
                        fill="currentColor"
                      />
                    </svg>
                    <Text as="span" weight="bold" marginLeft="sm" fontFamily="habibi">
                      Blog
                    </Text>
                  </button>
                </nav>

                <!-- Banner image with proper alt text -->
                <div v-if="blog.image?.id" class="blog-banner-image">
                  <img
                    :src="`https://burnes-center.directus.app/assets/${blog.image.id}`"
                    :alt="blog.image.description || `Featured image for article: ${blog.title}`"
                    class="blog-image"
                    loading="lazy"
                  />
                </div>

                <!-- Article title -->
                <TitleText
                  :level="'h1'"
                  size="5xl"
                  weight="bold"
                  class="blog-title"
                  fontFamily="sora"
                  lineHeight="super-loose"
                  style="letter-spacing: normal"
                  id="article-title"
                >
                  {{ blog.title }}
                </TitleText>

                <!-- Share section -->
                <div class="share-section" role="region" aria-label="Share this article">
                  <ShareWidget
                    :url="`https://rebootdemocracy.ai/blog/${blog.slug}`"
                    :title="blog.title"
                    :description="blog.excerpt || 'A Reboot Democracy article.'"
                  />
                </div>

                <!-- Article excerpt -->
                <div v-if="blog.excerpt" class="blog-excerpt">
                  <p class="excerpt-paragraph" role="text" aria-label="Article summary">
                    {{ blog.excerpt }}
                  </p>
                </div>

                <!-- Publication info -->
                <div class="publication-info" role="region" aria-label="Publication details">
                  <div class="publication-date">
                    <Text size="base" weight="normal" fontFamily="habibi">
                      Published on
                      <Text 
                        as="span" 
                        size="base" 
                        weight="bold" 
                        fontFamily="sora"
                        :aria-label="`Publication date: ${formatDate(blog.date)}`"
                      >
                        {{ formatDate(blog.date) }}
                      </Text>
                    </Text>
                  </div>

                  <!-- Authors list -->
                  <div
                    v-if="blog.authors && blog.authors.length > 0"
                    class="author-info-list"
                  >
                    <div
                      v-for="(author, index) in blog.authors"
                      :key="index"
                      class="author-info"
                      :aria-label="`Author ${index + 1} of ${blog.authors.length}`"
                    >
                      <img
                        class="author-headshot"
                        :src="getAuthorImageUrl(author.team_id)"
                        :alt="`Photo of ${getAuthorName(author.team_id)}`"
                        loading="lazy"
                      />
                      <div class="author-details">
                        <Text size="base" weight="bold" fontFamily="habibi">
                          {{ getAuthorName(author.team_id) }}
                        </Text>
                        <Text
                          v-if="author.team_id?.Link_to_bio"
                          as="a"
                          :href="author.team_id.Link_to_bio"
                          size="base"
                          weight="medium"
                          class="read-bio-link"
                          :aria-label="`Read biography of ${getAuthorName(author.team_id)}`"
                        >
                          Read Bio →
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </header>
            </template>
          </template>
        </main>
      </section>
    </div>
  </div>

  <!-- Blog main content: plain white background -->
  <section class="blog-detail" role="region" aria-labelledby="article-title">
    <div 
      v-if="blog?.audio_version" 
      class="audio-version"
      role="region"
      aria-label="Audio version of this article"
    >
      <p>
        <em>Listen to the AI-generated audio version of this piece.</em>
      </p>
      <AudioPlayer
        :audioSrc="`https://burnes-center.directus.app/assets/${blog.audio_version.id}`"
        :aria-label="`Audio version of ${blog.title}`"
      />
    </div>

    <!-- Main article content -->
    <div class="blog-content-container">
      <article 
        v-if="blog?.content" 
        class="blog-content" 
        v-html="blog.content"
        role="article"
        aria-labelledby="article-title"
      ></article>
    </div>
  </section>

  <!-- Tags section -->
  <section 
    v-if="blog && blog.Tags && blog.Tags.length > 0" 
    class="blog-tags-section" 
    role="region" 
    aria-label="Article tags"
  >
    <div class="blog-tags-container">
      <TitleText
        :level="'h2'"
        size="2xl"
        weight="bold"
        fontFamily="sora"
        class="tags-heading"
      >
        Tags
      </TitleText>
      
      <div class="blog-tags-list">
        <nav aria-label="Article tags">
          <button
            v-for="(tag, index) in blog.Tags"
            :key="index"
            class="tag-button"
            @click="navigateToCategory(tag)"
            @keydown="handleKeydown($event, () => navigateToCategory(tag))"
            :aria-label="`View all articles in category: ${tag}`"
            type="button"
          >
            {{ tag }}
          </button>
        </nav>
      </div>
    </div>
  </section>

  <!-- Related articles -->
  <aside role="complementary" aria-label="Related articles">
    <RelatedBlogCards :relatedBlogs="relatedBlogs" />
  </aside>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blog",
});

import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { BlogPost } from "@/types/BlogPost";
import { format } from "date-fns";
import { 
  fetchBlogBySlug, 
  fetchRelatedBlogsByTags 
} from "../../src/helpers/blogHelper";

const { showSearchResults, setIndexNames, resetSearch } = useSearchState();

const route = useRoute();
const router = useRouter();

// Reactive data
const blog = ref<BlogPost | null>(null);
const relatedBlogs = ref<BlogPost[]>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

// Computed slug from route params
const blogslug = computed(() => route.params.slug as string);

// Accessibility: Keyboard navigation handler
const handleKeydown = (event: KeyboardEvent, callback: () => void): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

// Function to load blog data
async function loadBlogData() {
  try {
    isLoading.value = true;
    error.value = null;
    
    if (!blogslug.value) {
      blog.value = null;
      relatedBlogs.value = [];
      return;
    }

    // Fetch main blog post
    const blogPost = await fetchBlogBySlug(blogslug.value);
    
    if (!blogPost) {
      blog.value = null;
      relatedBlogs.value = [];
      isLoading.value = false;
      return;
    }
    
    blog.value = blogPost;

    // Fetch related blogs if the current blog has tags
    if (blogPost.Tags && blogPost.Tags.length > 0) {
      const relatedPostsList = await fetchRelatedBlogsByTags(
        blogPost.Tags,
        blogslug.value
      );
      relatedBlogs.value = relatedPostsList;
    } else {
      relatedBlogs.value = [];
    }

  } catch (err) {
    console.error("Error loading blog data:", err);
    error.value = err as Error;
    blog.value = null;
    relatedBlogs.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Watch for route changes to reload data
watch(blogslug, async (newSlug, oldSlug) => {
  if (newSlug !== oldSlug) {
    await loadBlogData();
    // Update SEO meta after loading new blog
    updateSeoMeta();
    // Enhance accessibility after content loads
    await nextTick(() => {
      enhanceContentAccessibility();
    });
  }
});

// SEO Meta helper functions
function getSocialImageUrl(image: any): string {
  const imageId = image?.id || image?.filename_disk;
  return imageId
    ? `https://burnes-center.directus.app/assets/${imageId}?width=1200&height=630&fit=cover&format=jpg`
    : "https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3";
}

function updateSeoMeta() {
  useSeoMeta({
    title: () => blog.value?.title || "RebootDemocracy.AI",
    description: () =>
      blog.value?.excerpt || "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    ogTitle: () => blog.value?.title || "RebootDemocracy.AI",
    ogDescription: () =>
      blog.value?.excerpt || "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    ogImage: () => getSocialImageUrl(blog.value?.image),
    ogImageWidth: '1200',
    ogImageHeight: '630',
    ogUrl: () => `https://rebootdemocracy.ai/blog/${blogslug.value}`,
    ogType: 'article',
    twitterTitle: () => blog.value?.title || "RebootDemocracy.AI",
    twitterDescription: () =>
      blog.value?.excerpt || "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    twitterImage: () => getSocialImageUrl(blog.value?.image),
    twitterCard: "summary_large_image",
  });

  useHead({
    link: [
      { rel: 'canonical', href: `https://rebootdemocracy.ai/blog/${blogslug.value}` }
    ]
  });
}

// Function to navigate to blogs filtered by category
function navigateToCategory(category: string) {
  router.push({
    path: "/blog",
    query: { category },
  });
}

// Function to get image URL with fallback
function getAuthorImageUrl(authorData: any, width: number = 600): string {
  if (!authorData || !authorData.Headshot || !authorData.Headshot.id) {
    return "/images/exampleImage.png";
  }
  return `https://burnes-center.directus.app/assets/${authorData.Headshot.id}?width=${width}`;
}

// Function to get author name
function getAuthorName(author: any): string {
  if (!author) return "Unknown Author";
  return `${author.First_Name || ""} ${author.Last_Name || ""}`.trim();
}

// Function to get author bio
function getAuthorBio(author: any): string {
  if (!author) return "Reboot Democracy contributor";
  const name = getAuthorName(author);
  return `${name} works at the Burnes Center for Social Change and writes on Reboot Democracy about how AI impacts public service delivery, lawmaking and research`;
}

// Function to format multiple authors for display
function getAuthorsDisplayText(authors: any[]): string {
  if (!authors || authors.length === 0) return "Unknown Author";

  return authors
    .map((author) => getAuthorName(author.team_id))
    .filter((name) => name.trim() !== "")
    .join(", ");
}

// Function to format date using date-fns (consistent with your PostCard)
function formatDate(dateValue: Date | string) {
  if (!dateValue) return "unknown date";
  try {
    const date =
      typeof dateValue === "string"
        ? new Date(dateValue)
        : dateValue || new Date();
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "invalid date";
  }
}

// Function to enhance accessibility of the blog content after it's loaded
function enhanceContentAccessibility() {
  const blogContent = document.querySelector('.blog-content');
  if (!blogContent) return;

  // Add proper heading hierarchy
  const headings = blogContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = `heading-${index + 1}`;
    }
  });

  // Ensure all images have alt text
  const images = blogContent.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.alt) {
      img.alt = 'Article image';
    }
    img.loading = 'lazy';
  });

  // Ensure all links open external links properly
  const links = blogContent.querySelectorAll('a[href^="http"]');
  links.forEach((link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    
    // Add screen reader text for external links
    if (!link.querySelector('.sr-only')) {
      const srText = document.createElement('span');
      srText.className = 'sr-only';
      srText.textContent = ' (opens in new window)';
      link.appendChild(srText);
    }
  });

  // Add table accessibility
  const tables = blogContent.querySelectorAll('table');
  tables.forEach((table, index) => {
    if (!table.getAttribute('role')) {
      table.setAttribute('role', 'table');
    }
    if (!table.getAttribute('aria-label')) {
      table.setAttribute('aria-label', `Data table ${index + 1}`);
    }
    
    // Add table headers scope
    const headers = table.querySelectorAll('th');
    headers.forEach((header) => {
      if (!header.getAttribute('scope')) {
        header.setAttribute('scope', 'col');
      }
    });
  });
}

// Load data when component is mounted
onMounted(async () => {
  resetSearch();
  setIndexNames(["reboot_democracy_blog", "reboot_democracy_weekly_news"]);
  
  // Load blog data
  await loadBlogData();
  
  // Update SEO meta
  updateSeoMeta();
  
  // Enhance accessibility of dynamically loaded content
  await nextTick(() => {
    enhanceContentAccessibility();
  });
});

onBeforeUnmount(() => {
  resetSearch();
});
</script>

