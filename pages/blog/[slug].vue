<template>
  <!-- Full-width purple gradient background -->
  <div class="blog-gradient-background">
    <div class="blog-gradient-inner">
      <section class="blog-section">
        <main id="main-content" class="left-content-blog" role="main">
          <div
            v-if="showSearchResults"
            class="search-results-fullpage"
            role="search"
            aria-label="Search results"
          >
            <!-- Search Results Header -->
            <div class="search-results-header">
              <TitleText
                :level="'h1'"
                size="3xl"
                weight="bold"
                fontFamily="sora"
                class="search-results-title"
              >
                Search Results
              </TitleText>
              <Text
                v-if="searchQuery"
                size="lg"
                weight="normal"
                fontFamily="merriweather"
                class="search-query-display"
              >
                Showing results for: <strong>"{{ searchQuery }}"</strong>
              </Text>
              <Text
                v-if="totalResults !== undefined"
                size="base"
                weight="normal"
                fontFamily="merriweather"
                class="search-count-display"
              >
                {{ totalResults }}
                {{ totalResults === 1 ? "result" : "results" }} found
              </Text>
            </div>

            <!-- Search Results Content -->
            <div class="search-results-content">
              <GlobalSearch />
            </div>
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
                    <Text
                      as="span"
                      weight="bold"
                      marginLeft="sm"
                      fontFamily="merriweather"
                    >
                      Blog
                    </Text>
                  </button>
                </nav>

                <!-- Banner image with proper alt text -->
                <div v-if="blog.image?.id" class="blog-banner-image">
                  <img
                    :src="`https://burnes-center.directus.app/assets/${blog.image.id}`"
                    :alt="
                      blog.image.description ||
                      `Featured image for article: ${blog.title}`
                    "
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
                <div
                  class="share-section"
                  role="region"
                  aria-label="Share this article"
                >
                  <ShareWidget
                    :url="`https://rebootdemocracy.ai/blog/${blog.slug}`"
                    :title="blog.title"
                    :description="blog.excerpt || 'A Reboot Democracy article.'"
                  />
                </div>

                <!-- Article excerpt -->
                <div v-if="blog.excerpt" class="blog-excerpt">
                  <p
                    class="excerpt-paragraph"
                    role="text"
                    aria-label="Article summary"
                  >
                    {{ blog.excerpt }}
                  </p>
                </div>

                <!-- Publication info -->
                <div
                  class="publication-info"
                  role="region"
                  aria-label="Publication details"
                >
                  <div class="publication-date">
                    <Text size="base" weight="normal" fontFamily="merriweather">
                      Published on
                      <Text
                        as="span"
                        size="base"
                        weight="bold"
                        fontFamily="sora"
                        :aria-label="`Publication date: ${formatDate(
                          blog.date
                        )}`"
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
                      :aria-label="`Author ${index + 1} of ${
                        blog.authors.length
                      }`"
                    >
                      <img
                        class="author-headshot"
                        :src="getAuthorImageUrl(author.team_id)"
                        :alt="`Photo of ${getAuthorName(author.team_id)}`"
                        loading="lazy"
                      />
                      <div class="author-details">
                        <Text
                          size="base"
                          weight="bold"
                          fontFamily="merriweather"
                        >
                          {{ getAuthorName(author.team_id) }}
                        </Text>
                        <Text
                          v-if="author.team_id?.Link_to_bio"
                          as="a"
                          :href="author.team_id.Link_to_bio"
                          size="base"
                          weight="medium"
                          class="read-bio-link"
                          :aria-label="`Read biography of ${getAuthorName(
                            author.team_id
                          )}`"
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

  <!-- Blog main content: plain white background - Only show when NOT showing search results -->
  <template v-if="!showSearchResults">
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
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blog",
});

import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { BlogPost } from "@/types/BlogPost";
import { format } from "date-fns";

const {
  showSearchResults,
  setIndexNames,
  resetSearch,
  searchQuery,
  totalResults,
} = useSearchState();

const route = useRoute();
const router = useRouter();

const blogslug = computed(() => route.params.slug as string);

// Accessibility: Keyboard navigation handler
const handleKeydown = (event: KeyboardEvent, callback: () => void): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
};

const {
  data: blogData,
  pending,
  error,
} = await useAsyncData(`blog-${route.params.slug}`, async () => {
  if (!route.params.slug) return { blog: null, relatedBlogs: [] };

  // Get main blog post
  const blogPost = await fetchBlogBySlug(route.params.slug as string);

  // Get related blogs in the same server request
  let relatedPostsList: BlogPost[] = [];
  if (blogPost?.Tags?.length) {
    relatedPostsList = await fetchRelatedBlogsByTags(
      blogPost.Tags,
      route.params.slug as string
    );
  }

  return {
    blog: blogPost,
    relatedBlogs: relatedPostsList,
  };
});

const blog = computed(() => blogData.value?.blog || null);
const relatedBlogs = computed(() => blogData.value?.relatedBlogs || []);

function getSocialImageUrl(image: any): string {
  const imageId = image?.id || image?.filename_disk;
  return imageId
    ? `https://burnes-center.directus.app/assets/${imageId}?width=1200&height=630&fit=cover&format=jpg`
    : "https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3";
}

if (import.meta.server) {
  useSeoMeta({
    title: () => blog.value?.title || "RebootDemocracy.AI",
    description: () =>
      blog.value?.excerpt ||
      "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    ogTitle: () => blog.value?.title || "RebootDemocracy.AI",
    ogDescription: () =>
      blog.value?.excerpt ||
      "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    ogImage: () => getSocialImageUrl(blog.value?.image),
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogUrl: () => `https://rebootdemocracy.ai/blog/${route.params.slug}`,
    ogType: "article",
    twitterTitle: () => blog.value?.title || "RebootDemocracy.AI",
    twitterDescription: () =>
      blog.value?.excerpt ||
      "RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.",
    twitterImage: () => getSocialImageUrl(blog.value?.image),
    twitterCard: "summary_large_image",
  });
}

useSeoMeta({
  title: () => blog.value?.title || "RebootDemocracy.AI",
  description: () =>
    blog.value?.excerpt ||
    `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to:

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another

As researchers, we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`,
  ogTitle: () => blog.value?.title || "RebootDemocracy.AI",
  ogDescription: () =>
    blog.value?.excerpt ||
    `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to:

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another

As researchers, we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`,
  ogImage: () => getSocialImageUrl(blog.value?.image),
  ogImageWidth: "1200",
  ogImageHeight: "630",
  ogUrl: () => `https://rebootdemocracy.ai/blog/${route.params.slug}`,
  ogType: "article",
  twitterTitle: () => blog.value?.title || "RebootDemocracy.AI",
  twitterDescription: () =>
    blog.value?.excerpt ||
    `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to:

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another

As researchers, we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`,
  twitterImage: () => getSocialImageUrl(blog.value?.image),
  twitterCard: "summary_large_image",
});

useHead({
  link: [
    {
      rel: "canonical",
      href: `https://rebootdemocracy.ai/blog/${route.params.slug}`,
    },
  ],
});

const isLoading = ref(true);

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

// Reset search results when component is mounted
onMounted(async () => {
  resetSearch();
  setIndexNames(["reboot_democracy_blog", "reboot_democracy_weekly_news"]);
  isLoading.value = false;

  // Enhance accessibility of dynamically loaded content
  await nextTick(() => {
    enhanceContentAccessibility();
  });
});

// Function to enhance accessibility of the blog content after it's loaded
function enhanceContentAccessibility() {
  const blogContent = document.querySelector(".blog-content");
  if (!blogContent) return;

  // Add proper heading hierarchy
  const headings = blogContent.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = `heading-${index + 1}`;
    }
  });

  // Ensure all images have alt text
  const images = blogContent.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.alt) {
      img.alt = "Article image";
    }
    img.loading = "lazy";
  });

  // Ensure all links open external links properly
  const links = blogContent.querySelectorAll('a[href^="http"]');
  links.forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");

    // Add screen reader text for external links
    if (!link.querySelector(".sr-only")) {
      const srText = document.createElement("span");
      srText.className = "sr-only";
      srText.textContent = " (opens in new window)";
      link.appendChild(srText);
    }
  });

  // Add table accessibility
  const tables = blogContent.querySelectorAll("table");
  tables.forEach((table, index) => {
    if (!table.getAttribute("role")) {
      table.setAttribute("role", "table");
    }
    if (!table.getAttribute("aria-label")) {
      table.setAttribute("aria-label", `Data table ${index + 1}`);
    }

    // Add table headers scope
    const headers = table.querySelectorAll("th");
    headers.forEach((header) => {
      if (!header.getAttribute("scope")) {
        header.setAttribute("scope", "col");
      }
    });
  });
}

// Clean up when navigating away from this component
onBeforeUnmount(() => {
  resetSearch();
});
</script>

<style>
/* Accessibility enhancements - additive only */

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.search-results-fullpage {
  min-height: 70vh;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  padding: 2rem;
  background: #f8fafc;
}

.search-results-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 1rem 2rem;
}

.search-results-title {
  margin-bottom: 1rem !important;
  color: rgb(0, 51, 102) !important;
}

.search-query-display {
  margin-bottom: 0.5rem !important;
  color: #475569 !important;
}

.search-query-display strong {
  color: #1e293b !important;
  font-weight: 600 !important;
}

.search-count-display {
  color: #64748b;
  font-style: italic;
}

.search-results-content {
  max-width: 720px;
  margin: 0 auto;
}

/* Enhanced focus indicators using box-shadow */
.blog-back-btn:focus,
.category-tag:focus,
.read-bio-link:focus {
  outline: none;
  box-shadow: 0 0 0 1px #4a6b8a;
  border-radius: 4px;
}

/* Ensure buttons look clickable */
.blog-back-btn {
  cursor: pointer;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.blog-back-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.category-tag {
  cursor: pointer;
  color: #cddff3;
  background-color: rgb(0, 51, 102);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.category-tag:hover {
  background-color: rgba(13, 99, 235, 0.1);
  color: rgb(0, 51, 102);
}

/* Tags section at bottom of page */
.blog-tags-section {
  padding: 0.5rem 0;
  margin: 0.1rem 0rem 2rem 0rem;
}

.blog-tags-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem 1rem;
  background-color: #f8fafc;
}

.tags-heading {
  margin-bottom: 1.5rem;
  color: #1e293b;
}

.blog-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.blog-tags-list nav {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1.5rem 0rem;
}

.tag-button {
  cursor: pointer;
  background-color: #cddff3;
  color: #1e293b;
  border: none;
  padding: 0.5rem 1rem;
  margin: 0rem 0.2rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font-sora);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease-in-out;
}

.tag-button:hover {
  background-color: #9fc3ed;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px #4a6b8a;
  border-radius: 6px;
}

/* Responsive adjustments for search results */
@media (max-width: 768px) {
  .search-results-fullpage {
    padding: 1rem;
    margin-left: calc(-50vw + 50%);
  }

  .search-results-header {
    padding: 0 1rem;
    margin-bottom: 2rem;
  }

  .search-results-content {
    max-width: 100%;
    padding: 0 1rem;
  }
}

/* Responsive adjustments for tags section */
@media (max-width: 768px) {
  .blog-tags-section {
    padding: 2rem 0;
    margin-top: 2rem;
  }

  .blog-tags-container {
    padding: 1rem 2rem;
  }

  .tags-heading {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  .blog-tags-list {
    flex-direction: row;
    gap: 0.75rem;
  }

  .blog-tags-list nav {
    flex-direction: column;
  }

  .tag-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .blog-tags-section {
    padding: 1.5rem 0;
    margin-top: 1.5rem;
  }

  .blog-tags-container {
    padding: 1rem 2rem;
  }

  .tags-heading {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .blog-tags-list {
    flex-direction: row;
    gap: 0.5rem;
  }

  .blog-tags-list nav {
    flex-direction: column;
  }

  .tag-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
}

/* Enhanced link accessibility */
.read-bio-link {
  text-decoration: underline;
  transition: all 0.2s ease-in-out;
}

.read-bio-link:hover {
  color: #4a6b8a;
}

/* Loading spinner accessibility */
.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #4a6b8a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Blog content accessibility enhancements */
.blog-content h1,
.blog-content h2,
.blog-content h3,
.blog-content h4,
.blog-content h5,
.blog-content h6 {
  scroll-margin-top: 20px; /* For anchor link navigation */
}

.blog-content p {
  margin-bottom: 20px;
}

.blog-content img {
  max-width: 100%;
  height: auto;
}

.blog-content table {
  border-collapse: collapse;
  width: 100%;
}

.blog-content th,
.blog-content td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.blog-content th {
  background-color: #f2f2f2;
  font-weight: bold;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .blog-back-btn:focus,
  .category-tag:focus,
  .tag-button:focus,
  .read-bio-link:focus {
    box-shadow: 0 0 0 3px #000000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .blog-back-btn,
  .category-tag,
  .tag-button,
  .read-bio-link,
  .loading-spinner {
    transition: none;
    animation: none;
    transform: none;
  }

  .tag-button:hover {
    transform: none;
  }
}

/* Focus within for complex components */
.author-info:focus-within {
  outline: 2px solid #4a6b8a;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Print styles for accessibility */
@media print {
  .skip-link,
  .blog-back-btn {
    display: none;
  }

  .blog-content a::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }
}
</style>
