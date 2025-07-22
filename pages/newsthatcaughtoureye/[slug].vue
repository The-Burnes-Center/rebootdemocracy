<template>
  <div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading content...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <Button variant="primary" @click="router.push('/')"
        >Return to Home</Button
      >
    </div>

    <template v-else-if="postData && postData.length > 0">
      <div class="weeklynews-hero">
        <img class="weeklynews-img" src="/images/newsheader.png" />
        <div class="weeklynews-details">
          <h1>{{ postData[0].title }}</h1>
          <p>
            Published by {{ postData[0].author }} on
            {{ formatDateOnly(new Date(postData[0].date)) }}
          </p>
        </div>
      </div>

      <!-- Table of Contents -->
      <div class="toc">
        <p class="excerpt">{{ postData[0].summary }}</p>
        <br />
        <p><strong>In the news this week</strong></p>
        <ul>
          <li v-for="cat in uniqueCategories" :key="cat">
            <a :href="'#' + cat.toLowerCase().replace(/\s+/g, '')">
              <strong>{{ cat }}:</strong>
            </a>
            <span class="toc-description">
              {{
                cat === "AI and Elections"
                  ? "Free, fair and frequent"
                  : cat === "Governing AI"
                  ? "Setting the rules for a fast-moving technology."
                  : cat === "AI for Governance"
                  ? "Smarter public institutions through machine intelligence."
                  : cat === "AI and Public Engagement"
                  ? "Bolstering participation"
                  : cat === "AI and Problem Solving"
                  ? "Research, applications, technical breakthroughs"
                  : cat === "AI Infrastructure"
                  ? "Computing resources, data systems and energy use"
                  : cat === "AI and International Relations (IR)"
                  ? "Global cooperation—or competition—over AI's future"
                  : cat === "AI and Education"
                  ? "Preparing people for an AI-driven world"
                  : cat === "AI and Public Safety"
                  ? "Law enforcement, disaster prevention and preparedness"
                  : cat === "AI and Labor"
                  ? "Worker rights, safety and opportunity"
                  : "News that caught our eye"
              }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Grouped News Items by Category -->
      <div class="news-items">
        <div v-for="cat in uniqueCategories" :key="cat">
          <h2 :id="cat.toLowerCase().replace(/\s+/g, '')" class="group-heading">
            {{ cat }}
          </h2>
          <div
            v-for="item in postData[0].items.filter(
              (item) =>
                (item.reboot_democracy_weekly_news_items_id.category ||
                  'News that caught our eye') === cat
            )"
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
              <strong>{{
                item.reboot_democracy_weekly_news_items_id.title
              }}</strong>
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
              class="read-article"
              target="_blank"
            >
              Read article
            </a>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute, useRouter, useHead } from "#imports";
import { format } from "date-fns";
import { createDirectus, rest, readItems } from "@directus/sdk";
import { useSeoMeta } from "#imports";
import { watchEffect } from "vue";
// Interfaces
interface WeeklyNewsItem {
  id: string;
  title: string;
  author: string;
  publication: string;
  date: string;
  excerpt: string;
  url: string;
  category?: string;
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
}

// Constants
const DIRECTUS_URL = "https://burnes-center.directus.app";

// Directus
const directus = createDirectus(DIRECTUS_URL).with(rest());
const route = useRoute();
const router = useRouter();
const slug = computed(() => route.params.slug as string);

// Fetch post data with useAsyncData
const {
  data: postData,
  pending: isLoading,
  error,
} = await useAsyncData(
  `weekly-news-${slug.value}`,
  async () => {
    const response = await directus.request(
      readItems("reboot_democracy_weekly_news", {
        meta: "total_count",
        limit: -1,
        fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"],
        filter: {
          _and: [
            { edition: { _eq: slug.value } },
            { status: { _eq: "published" } },
          ],
        },
      })
    );
    return response as WeeklyNewsPost[];
  },
  { server: true }
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

watchEffect(() => {
  const post = postData.value?.[0];

  const summaryText = post?.summary
    ? post.summary.replace(/<[^>]+>/g, "").slice(0, 200)
    : "Weekly news roundup on AI and democracy from Reboot Democracy";

  const imageUrl = post?.image
    ? `${DIRECTUS_URL}/assets/${post.image.id}`
    : "https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3";

  useSeoMeta({
    title: post
      ? `${post.title} - News That Caught Our Eye`
      : "News That Caught Our Eye - Reboot Democracy",

    description: summaryText,
    ogTitle: post
      ? `${post.title} - News That Caught Our Eye`
      : "News That Caught Our Eye - Reboot Democracy",
    ogDescription: summaryText,
    ogImage: imageUrl,
    ogType: post ? "article" : "website",
    ogUrl: post
      ? `https://rebootdemocracy.ai/newsthatcaughtoureye/${post.edition}`
      : "https://rebootdemocracy.ai/newsthatcaughtoureye",

    twitterTitle: post
      ? `${post.title} - News That Caught Our Eye`
      : "News That Caught Our Eye - Reboot Democracy",
    twitterDescription: summaryText,
    twitterImage: imageUrl,
    twitterCard: "summary_large_image",
  });
});

</script>

<style>
.weeklynews-hero {
  width: 100%;
  display: flex;
  padding: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.weeklynews-hero h1 {
  margin-top: -8rem;
  z-index: 100;
  color: #ffffff;
  font-size: 40px;
  font-family: var(--font-inria);
}

.weeklynews-img {
  height: 200px;
  width: 100%;
  object-fit: fill;
}

.weeklynews-details p {
  color: #ffffff;
  font-weight: 600;
}

/* Table of Contents Section */
.toc {
  padding: 1rem 10rem;
}

.toc ul {
  padding-left: 0;
  margin-top: 1em;
}

.toc li {
  color: #0d63eb;
  margin-bottom: 0.5em;
}

.toc a {
  color: #0d63eb;
  text-decoration: none;
  font-family: var(--font-inria);
}

.toc p {
  font-size: 18px;
  line-height: 1.8;
  margin-left: 1em;
  font-family: var(--font-inria);
}

.toc .news-heading {
  font-family: var(--font-inria);
}

.toc-description {
  color: #3d3d3d;
  margin-left: 0.5em;
}

/* Group Heading */
.group-heading {
  color: #0d63eb;
  border-bottom: 1px solid #0d63eb;
  padding-bottom: 5px;
  font-family: var(--font-inria);
}

/* News Items */
.news-items {
  padding: 0rem 10rem;
}

.news-item {
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.category-badge span {
  background-color: #519e8a;
  color: #ffffff;
  font-size: 10px;
  padding: 0.5em;
}

.item-title {
  color: #0d63eb;
  font-family: var(--font-habibi);
}

.item-meta {
  margin: 0;
  font-family: var(--font-inria);
}

.item-excerpt {
  font-family: var(--font-habibi);
  line-height: 32px;
}

.read-article {
  background-color: #0d63eb;
  color: #ffffff;
  text-decoration: none;
  text-transform: uppercase;
  padding: 0.25rem 0.25rem;
  width: fit-content;
  font-size: 12px;
  font-family: var(--font-inria);
  font-weight: 600;
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
  border-top: 5px solid #0d63eb;
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
@media (max-width: 768px) {
  .weeklynews-hero h1 {
    font-size: 24px;
    margin-top: -7rem;
    margin-left: 1rem;
    margin-right: 1rem;
  }
  .weeklynews-details p {
    margin-left: 1rem;
    margin-right: 1rem;
  }

  .weeklynews-img {
    height: 150px;
  }

  .weeklynews-header,
  .toc,
  .news-items {
    padding: 1rem;
  }
}
</style>