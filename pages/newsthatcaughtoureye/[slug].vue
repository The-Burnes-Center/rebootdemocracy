<template>
  <div id="top">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading content...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error.message || 'An error occurred while loading the content.' }}</p>
      <Button variant="primary" @click="navigateTo('/')"
        >Return to Home</Button
      >
    </div>

    <template v-else-if="postData && postData.length > 0">
      <div class="weeklynews-hero">
        <img
          v-if="!postData[0].image"
          class="weeklynews-img"
          src="/images/newsheader.png"
          alt="Weekly News header"
        />
        <img
          v-if="postData[0].image"
          class="weeklynews-img"
          :src="'https://content.thegovlab.com/assets/' + postData[0].image.id"
          :alt="postData[0].title"
        />
        <div class="weeklynews-overlay" aria-hidden="true"></div>
        <div class="weeklynews-details">
          <h1>{{ postData[0].title }}</h1>
          <p>
            Published on
            {{ formatDateOnly(new Date(postData[0].date)) }}
          </p>
        </div>
      </div>

      <!-- Sticky TOC Bar -->
      <nav class="toc-bar" aria-label="In this edition">
        <div class="weeklynews-container">
          <div class="toc-scroll">
            <a
              v-for="cat in uniqueCategories"
              :key="cat"
              class="toc-chip"
              :href="'#' + cat.toLowerCase().replace(/\s+/g, '')"
            >
              {{ cat }} <span class="toc-count">({{ getItemsByCategory(cat).length }})</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- Content -->
      <div class="weeklynews-container">
        <!-- Summary Accordion -->
        <section class="news-items">
          <details class="summary-card accordion" open>
            <summary class="accordion-summary">Summary</summary>
            <div class="accordion-content news-item" style="margin: 0;">
              <p class="excerpt" style="margin: 0;">{{ postData[0].summary }}</p>
            </div>
          </details>
        </section>

        <!-- Upcoming Events Section (Accordion) -->
        <section class="news-items" v-if="postData[0].events">
          <details class="accordion" open>
            <summary class="accordion-summary group-heading">Upcoming Events</summary>
            <div class="accordion-content">
              <div class="news-item" v-html="postData[0].events"></div>
            </div>
          </details>
        </section>

        <!-- Special Announcements Section (Accordion) -->
        <section class="news-items" v-if="postData[0].announcements">
          <details class="accordion">
            <summary class="accordion-summary group-heading">Special Announcements</summary>
            <div class="accordion-content">
              <div class="news-item" v-html="postData[0].announcements"></div>
            </div>
          </details>
        </section>

        <!-- Grouped News Items by Category -->
        <section
          v-for="cat in uniqueCategories"
          :key="cat"
          class="news-items category-group"
        >
          <h2 :id="cat.toLowerCase().replace(/\s+/g, '')" class="group-heading">
            {{ cat }}
          </h2>
          <div class="items-grid">
            <article
              v-for="item in getItemsByCategory(cat)"
              :key="item.reboot_democracy_weekly_news_items_id.id"
              class="news-item"
            >
              <p class="category-badge">
                <span>{{
                  item.reboot_democracy_weekly_news_items_id.category ||
                  "News that caught our eye"
                }}</span>
              </p>
              <h4 class="item-title">
                <span>{{ item.reboot_democracy_weekly_news_items_id.title }}</span>
              </h4>
              <div class="item-meta">
                <p>
                  <em>
                    {{ item.reboot_democracy_weekly_news_items_id.author }} on
                    {{
                      formatDateOnly(
                        new Date(item.reboot_democracy_weekly_news_items_id.date)
                      )
                    }}
                    in
                    {{ item.reboot_democracy_weekly_news_items_id.publication }}
                  </em>
                </p>
              </div>
              <p class="item-excerpt">
                {{ item.reboot_democracy_weekly_news_items_id.excerpt }}
              </p>
              <a
                :href="item.reboot_democracy_weekly_news_items_id.url"
                class="btn-primary btn read-article"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read article
              </a>

              <!-- Related Links Section -->
              <div v-if="item.reboot_democracy_weekly_news_items_id.related_links != ''" class="weekly-news-related-articles">
                <p><b>Related Articles:</b></p>
                <ul>
                  <li v-for="related_item in item.reboot_democracy_weekly_news_items_id.related_links">
                    <a :href="related_item.reboot_weekly_news_related_news_id.link">{{related_item.reboot_weekly_news_related_news_id.title}}</a>
                  </li>
                </ul>
              </div>
            </article>
          </div>
        </section>

        <a href="#top" class="back-to-top" aria-label="Back to top">▲</a>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute, useRouter, navigateTo } from "#imports";
import { format } from "date-fns";
import { createDirectus, rest, readItems } from "@directus/sdk";

// Interfaces
interface RelatedNewsItem {
  reboot_weekly_news_related_news_id: {
    title: string;
    link: string;
  };
}

interface WeeklyNewsItem {
  id: string;
  title: string;
  author: string;
  publication: string;
  date: string;
  excerpt: string;
  url: string;
  category?: string;
  related_links?: RelatedNewsItem[] | '';
}

interface WeeklyNewsItemWrapper {
  reboot_democracy_weekly_news_items_id: WeeklyNewsItem;
}

interface ImageItem {
  id: string;
  filename_disk: string;
  width?: number;
  height?: number;
}

interface WeeklyNewsPost {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  edition: string;
  status: string;
  items: WeeklyNewsItemWrapper[];
  image?: ImageItem;
  events?: string;
  announcements?: string;
}

// Constants
const DIRECTUS_URL = "https://burnes-center.directus.app";

// Directus
const directus = createDirectus(DIRECTUS_URL).with(rest());
const route = useRoute();
const router = useRouter();
const slug = computed(() => route.params.slug as string);

// Helper function to get the latest edition
const getLatestEdition = async () => {
  try {
    const response = await directus.request(
      readItems("reboot_democracy_weekly_news", {
        fields: ["edition"],
        filter: {
          status: { _eq: "published" },
        },
        limit: -1,
      })
    );

    if (response && response.length > 0) {
      const editions = response
        .map((item: any) => parseInt(item.edition))
        .filter((edition: number) => !isNaN(edition))
        .sort((a: number, b: number) => b - a);

      if (editions.length > 0) {
        return editions[0].toString();
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching latest edition:", error);
    return null;
  }
};

// Handle "latest" slug
let effectiveSlug = slug.value;
if (slug.value === "latest") {
  if (process.server) {
    // Server-side: fetch latest edition
    const latestEdition = await getLatestEdition();
    if (latestEdition) {
      effectiveSlug = latestEdition;
    }
  }
}

// Fetch post data with useAsyncData - optimized for build time
const {
  data: postData,
  pending: isLoading,
  error,
} = await useAsyncData(
  `weekly-news-${slug.value}`,
  async () => {
    try {
      let slugToUse = slug.value;
      
      // Check if the slug is "latest"
      if (slug.value === "latest") {
        const latestEdition = await getLatestEdition();
        if (latestEdition) {
          slugToUse = latestEdition;
          // On client side, replace the URL
          if (process.client) {
            await navigateTo(`/newsthatcaughtoureye/${latestEdition}`, { replace: true });
          }
        } else {
          throw new Error("No published editions found");
        }
      }

      const response = await directus.request(
        readItems("reboot_democracy_weekly_news", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*,items.reboot_democracy_weekly_news_items_id.related_links.*.*"],
          filter: {
            _and: [
              { edition: { _eq: slugToUse } },
              { status: { _eq: "published" } },
            ],
          },
        })
      );
      return response as WeeklyNewsPost[];
    } catch (err) {
      console.error('Error fetching weekly news:', err);
      throw err;
    }
  },
  { 
    server: true,
    lazy: false, 
    transform: (data) => data, 
  }
);

// Format date
const formatDateOnly = (date: Date): string => {
  return format(date, "MMMM d, yyyy");
};

// Unique categories
const uniqueCategories = computed(() => {
  if (!postData.value?.length || !postData.value[0].items) return [];
  const cats = postData.value[0].items.map(
    (item) =>
      item.reboot_democracy_weekly_news_items_id.category ||
      "News that caught our eye"
  );
  return [...new Set(cats)];
});

// Typed helper to get items by category (prevents implicit any in template)
const getItemsByCategory = (category: string): WeeklyNewsItemWrapper[] => {
  const items = postData.value?.[0]?.items ?? [];
  return items.filter((wrapper: WeeklyNewsItemWrapper) => {
    const itemCategory =
      wrapper.reboot_democracy_weekly_news_items_id.category ||
      "News that caught our eye";
    return itemCategory === category;
  });
};

// Set up meta tags with reactive values
const post = computed(() => postData.value?.[0]);

const metaTitle = computed(() => 
  post.value 
    ? `${post.value.title} - News That Caught Our Eye`
    : "News That Caught Our Eye - Reboot Democracy"
);

const metaDescription = computed(() => 
  post.value?.summary
    ? post.value.summary.replace(/<[^>]+>/g, "").slice(0, 200)
    : "Weekly news roundup on AI and democracy from Reboot Democracy"
);

const metaImageUrl = computed(() => 
  post.value?.image
    ? `${DIRECTUS_URL}/assets/${post.value.image.id}`
    : "https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3"
);

const metaUrl = computed(() => 
  post.value
    ? `https://rebootdemocracy.ai/newsthatcaughtoureye/${post.value.edition}`
    : "https://rebootdemocracy.ai/newsthatcaughtoureye"
);

useHead({
  title: () => metaTitle.value,
  meta: () => [
    { name: 'description', content: metaDescription.value },
    { property: 'og:title', content: metaTitle.value },
    { property: 'og:description', content: metaDescription.value },
    { property: 'og:image', content: metaImageUrl.value },
    { property: 'og:type', content: post.value ? 'article' : 'website' },
    { property: 'og:url', content: metaUrl.value },
    { name: 'twitter:title', content: metaTitle.value },
    { name: 'twitter:description', content: metaDescription.value },
    { name: 'twitter:image', content: metaImageUrl.value },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
});

// Also use useSeoMeta with reactive values
useSeoMeta({
  title: () => metaTitle.value,
  description: () => metaDescription.value,
  ogTitle: () => metaTitle.value,
  ogDescription: () => metaDescription.value,
  ogImage: () => metaImageUrl.value,
  ogType: () => post.value ? 'article' : 'website',
  ogUrl: () => metaUrl.value,
  twitterTitle: () => metaTitle.value,
  twitterDescription: () => metaDescription.value,
  twitterImage: () => metaImageUrl.value,
  twitterCard: () => 'summary_large_image',
});
</script>

<style>

html {
  scroll-behavior: smooth;
  scroll-padding-top: 96px;
}

/* Page wrapper width control */
.weeklynews-container {
  max-width: 960px;
  margin: 0 auto;
}

.toc-scroll {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 1.5rem 0.2rem;
  border-bottom: 1px solid #e6e6e6;
}

.toc-chip {
  white-space: nowrap;
  padding: 0.5rem 0.6rem;
  border: 1px solid #cddff3;
  border-radius: 999px;
  color: rgb(0, 51, 102);
  text-decoration: none;
  font-family: var(--font-sora);
  font-weight: 600;
  line-height: 20px;
  font-size: 14px;
  background: linear-gradient(to left, #f8fafc, #f1f5f9);
}

.toc-chip:hover {
  text-decoration: underline;
}

.weeklynews-hero {
  position: relative;
  width: 100%;
  display: flex;
  padding: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.weeklynews-hero h1 {
  position: relative;
  z-index: 2;
  color: #ffffff;
  font-size: 40px;
  font-family: var(--font-sora);
  margin: 0;
}

.weeklynews-img {
  height: 250px;
  width: 100%;
  object-fit: cover;
}

.weeklynews-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 250px;
  background: rgba(0, 50, 102, 0.35);
  z-index: 1;
}

.weeklynews-details {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  z-index: 2;
  width: 100%;
}

.weeklynews-details h1 {
  color: #ffffff;
  font-size: 40px;
  font-family: var(--font-sora);
  margin: 0 auto 0.5rem auto;
  text-align: center;
  width: 100%;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.weeklynews-details p {
  color: #ffffff;
  font-weight: 600;
  margin: 0.5rem auto 0 auto;
  font-family: var(--font-habibi);
  font-size: 20px;
  text-align: center;
  width: 100%;
  line-height: 1.4;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}


/* Group Heading */
.group-heading {
  color: rgb(0, 51, 102);
  border-bottom: 1px solid rgb(0, 51, 102);
  padding-bottom: 0.8rem;
  margin: 0;
  font-family: var(--font-sora);
  border-bottom: 1px solid #e6e6e6;
}

/* News Items */
.news-items {
  padding: 1rem 1.5rem;
}

.news-item {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  font-family: var(--font-habibi);
  font-size: 18px;
  line-height: 1.4;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
}
.news-item p{
  margin: 0;
}

.news-item:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06), 0 0 0 2px #cddff3 inset;
}

.category-group {
  margin-top: 0.25rem;
}

.items-grid {
  display: block;
  width: 100%;
}

.items-grid .news-item:nth-child(odd) {
  background: transparent;
}

.summary-card {
  background: linear-gradient(135deg, #e6f2ff 0%, #cddff3 100%);
  margin: 0 auto;
}

/* Accordion styles */
.accordion {
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
  margin: 0;
}

.accordion-summary {
  cursor: pointer;
  list-style: none;
  padding: 0.75rem 1rem;
  font-family: var(--font-sora);
  font-weight: 600;
  color: rgb(0, 51, 102);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  border-bottom: none;
  background: linear-gradient(135deg, #e6f2ff 0%, #cddff3 100%);
}

.accordion[open] .accordion-summary {
  border-bottom: 1px solid #e6e6e6;
}

.accordion-content {
  padding: 0.75rem 1rem;
}

.accordion-summary::-webkit-details-marker {
  display: none;
}


.accordion-summary::after {
  content: '▾';
  margin-left: auto;
  color: rgb(0, 51, 102);
  font-size: 0.9rem;
  line-height: 1;
  transition: transform 0.2s ease;
}

.accordion[open] .accordion-summary::after {
  content: '▴';
}

.accordion[open] .accordion-summary::before {
  transform: rotate(90deg);
}

.accordion-summary:hover {
  background: #f8fafc;
}

.category-badge span {
  background-color: #cddff3;
  font-size: 14px;
  font-weight: 600;
  color: rgb(0, 51, 102);
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: var(--font-sora);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.item-title {
  color: rgb(0, 51, 102);
  font-family: var(--font-sora);
  font-size: 18px;
  margin: 0;
}

.item-meta {
  margin: 0;
  font-family: var(--font-habibi);
  font-size: 16px;
  line-height: 18px;

}

.item-excerpt {
  font-size: 18px;
  font-family: var(--font-habibi);
  line-height: 28px;
  margin: 0;
}

.read-article {
  background-color: #013872;
  color: #ffffff;
  text-decoration: none;
  text-transform: uppercase;
  padding: 0.5rem 0.5rem;
  width: fit-content;
  font-size: 15px;
  font-family: var(--font-habibi);
  font-weight: 600;
  border-radius: 4px;
  margin-top: 0.25rem;
  display: inline-block;
}

/* Related Articles Section */
.weekly-news-related-articles {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
}

.weekly-news-related-articles p {
  margin: 0 0 0.5rem 0;
  font-family: var(--font-habibi);
}

.weekly-news-related-articles ul {
  margin: 0;
  padding-left: 1.5rem;
}

.weekly-news-related-articles li {
  margin-bottom: 0.25rem;
  font-family: var(--font-habibi);
}

.weekly-news-related-articles a {
  color: rgb(0, 51, 102);
  text-decoration: none;
  font-family: var(--font-habibi);
}

.weekly-news-related-articles a:hover {
  text-decoration: underline;
}

.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 120px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(0, 51, 102);
  border-radius: 9999px;
  background-color: #ffffff;
  color: rgb(0, 51, 102);
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

/* Loading and Error Styles */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 2rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid rgb(0, 51, 102);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  color: #c8102e;
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  .weeklynews-img {
    height: 250px;
  }
  .weeklynews-overlay,
  .weeklynews-details {
    height: 250px;
  }
  
  .weeklynews-details h1 {
    font-size: 48px;
  }
  
  .weeklynews-details p {
    font-size: 20px;
  }
}

@media (min-width: 1024px) {
  .weeklynews-img {
    height: 250px;
  }
  .weeklynews-overlay,
  .weeklynews-details {
    height: 250px;
  }
  .weeklynews-container .news-items {
    padding: 0.8rem 0.5rem;
    border-top: 1px solid #e6e6e6;
  }
}

@media (max-width: 1023px) {
  .back-to-top {
    right: 16px;
    bottom: 16px;
  }
  .items-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 375px) {
  .toc-scroll {
  padding: 1.5rem 1rem;
}
}

@media (min-width: 390px) and (max-width: 800px) {
  .toc-scroll {
    padding: 1.5rem 1rem;}
}

</style>