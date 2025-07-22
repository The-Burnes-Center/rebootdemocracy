<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { format, isPast, isFuture } from "date-fns";
import { useRoute, useHead } from "#imports";
import type { IndexData, ResourceItem } from "../../types/index.ts";
import { createDirectus, readItems, rest } from "@directus/sdk";

// Constants
const DIRECTUS_URL = "https://burnes-center.directus.app";
const directus = createDirectus(DIRECTUS_URL).with(rest());
useHead({
  title: 'Reboot Democracy',
  meta: [
    { 
      name: 'description', 
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to better governance, better outcomes, increased trust in institutions, and in one another. As researchers we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` 
    },
    { property: 'og:title', content: 'Reboot Democracy' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://rebootdemocracy.ai' },
    { 
      property: 'og:description', 
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to better governance, better outcomes, increased trust in institutions, and in one another. As researchers we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` 
    },
    { property: 'og:image', content: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3' },
    { name: 'twitter:title', content: 'RebootDemocracy.AI' },
    { 
      name: 'twitter:description', 
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to better governance, better outcomes, increased trust in institutions, and in one another. As researchers we want to understand how best to "do democracy" in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` 
    },
    { name: 'twitter:image', content: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ],
});

// State management
const route = useRoute();

// Helper formatting functions
const formatDateTime = (d: Date | string) =>
  format(new Date(d), "MMMM d, yyyy, h:mm aa");
const formatDateOnly = (d: Date | string) =>
  format(new Date(d), "MMMM d, yyyy");
const isPastDate = (d: Date | string) => isPast(new Date(d));
const isFutureDate = (d: Date | string) => isFuture(new Date(d));

const {
  data: indexData,
  pending: isIndexLoading,
  error: indexError,
} = await useAsyncData(
  "engagement-index",
  async () => {
    const response = await directus.request(
      readItems("reboot_democracy", {
        meta: "total_count",
        limit: 1,
        fields: ["id", "engagement_title", "engagement_description"],
      })
    );
    return Array.isArray(response) ? response[0] : response;
  },
  { server: true }
);

// Fetch article data from Directus
const {
  data: articleData,
  pending: isArticleLoading,
  error: articleError,
} = await useAsyncData(
  "engagement-articles",
  async () => {
    const filter = { type: { _eq: "Engagement" } };
    const response = await directus.request(
      readItems("reboot_democracy_resources", {
        meta: "total_count",
        limit: -1,
        sort: ["-id"],
        fields: [
          "id",
          "type",
          "thumbnail.id",
          "stage",
          "partner",
          "title",
          "description",
          "link",
        ],
        filter,
      })
    );
    return response as ResourceItem[];
  },
  { server: true }
);

const selectedType = ref("All");
</script>

<template>
  <div class="resource-page our-engagements-page">
    <div v-if="isIndexLoading || isArticleLoading" class="loading">
      <div class="loader"></div>
      <p>Loading content...</p>
    </div>
    <template v-else>
      <div class="resource-description">
        <h1>{{ indexData?.engagement_title }}</h1>
        <p
          class="our-work-description"
          v-html="indexData?.engagement_description"
        ></p>
        <div class="resource-menu">
          <ul>
            <li
              @click="selectedType = 'All'"
              :class="{ isActive: selectedType == 'All' }"
            >
              All Engagements
            </li>
          </ul>
        </div>
      </div>
      <div class="resource-scroll-section">
        <div class="resource-scroller">
          <div v-if="articleData?.length === 0" class="no-content">
            <p>No engagements found.</p>
          </div>
          <template v-else v-for="item in articleData || []" :key="item.id">
            <div
              class="featured-items"
              v-show="item.type == selectedType || selectedType == 'All'"
            >
              <div class="featured-item-text">
                <div class="resource-item-img">
                  <img
                    v-if="item.thumbnail && item.thumbnail.id"
                    :src="`${DIRECTUS_URL}/assets/${item.thumbnail.id}?width=648`"
                    alt="Engagement thumbnail"
                  />
                  <img
                    v-else
                    :src="`${DIRECTUS_URL}/assets/a23c4d59-eb04-4d2a-ab9b-74136043954c?quality=80`"
                    alt="Default thumbnail"
                  />
                </div>
                <div
                  class="event-tag-row"
                  v-if="item.stage && item.stage.length > 0"
                >
                  <div class="engagement_dot"></div>
                  <p>{{ item.stage[0] }}</p>
                </div>
                <h5 class="eyebrow peach">
                  Partner: {{ item.partner || "Various" }}
                </h5>
                <h4>{{ item.title || "Engagement Project" }}</h4>
                <p>{{ item.description || "No description available." }}</p>
                <a
                  class="btn btn-small btn-secondary"
                  :href="item.link || '#'"
                  :target="item.link ? '_blank' : '_self'"
                >
                  Details <i class="fa-regular fa-arrow-right"></i>
                </a>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="resource-image"></div>
    </template>
  </div>
  <Mailing />
</template>

<style>
/* Import fonts */
@import url("https://fonts.googleapis.com/css2?family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");

/* CSS Variables */
:root {
  --peach-action: rgba(247, 158, 130, 1);
  --peach-light: rgba(255, 233, 229, 1);
  --peach-text: rgba(214, 53, 18, 1);
}

/* Typography Styles */
.our-engagements-page h1 {
  font-family: var(--font-habibi);
  font-size: 62.5px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -2.5px;
}

.our-engagements-page h4 {
  font-family: var(--font-habibi);
  font-size: 18px;
  margin: 0;
  padding: 0;
}

.our-engagements-page h5.eyebrow {
  width: fit-content;
  padding: 0.2em 0.5em;
  font-size: 0.7em;
}

.our-engagements-page p,
.our-engagements-page li {
  font-family: var(--font-inria);
  font-weight: 500;
  margin: 0;
  padding: 0;
}

.our-engagements-page .eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-family: var(--font-habibi);
  letter-spacing: 2.4px;
}

/* Button Styles */
.our-engagements-page a.btn {
  font-size: 0.8rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-decoration: none;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  font-family: var(--font-habibi);
  color: #000000;
}

.our-engagements-page a.btn:hover {
  cursor: pointer;
}

.our-engagements-page .btn-secondary {
  color: #000000;
  background: var(--peach-action);
  border: 1px solid #000000;
}

.our-engagements-page .btn-small {
  width: fit-content;
  padding: 0 15px;
  height: 35px;
  min-height: 35px;
}

/* Loading and Error Styles */
.our-engagements-page .loading,
.our-engagements-page .error-message,
.our-engagements-page .no-content {
  padding: 2rem;
  text-align: center;
  font-family: var(--font-inria);
  font-weight: 500;
  width: 100%;
}

.our-engagements-page .loading {
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.our-engagements-page .error-message {
  color: #c8102e;
}

.our-engagements-page .no-content {
  color: #666;
  font-style: italic;
}

/* Loader animation */
.our-engagements-page .loader {
  width: 48px;
  height: 48px;
  border: 5px solid;
  border-color: var(--peach-action) transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Resource Page Styles */
.resource-page {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.resource-description {
  display: flex;
  flex-direction: column;
  width: 70%;
  padding: 4rem 5rem;
  gap: 20px;
}

.resource-description p {
  font-family: var(--font-habibi);
  font-size: 20px;
}

.resource-scroll-section {
  display: flex;
  flex-direction: row;
  width: 60%;
  padding: 4rem 0;
}

.resource-scroller {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 2rem;
  border: 1px solid #000000;
  z-index: 100;
  height: fit-content;
  max-height: 800px;
  overflow: auto;
  gap: 1rem;
}

.resource-image {
  width: 20%;
  height: 1000px;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  margin-left: -12rem;
}

.resource-menu li {
  font-family: var(--font-habibi);
  font-size: 20px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: 2.4px;
  text-transform: uppercase;
}

.resource-menu ul {
  list-style-type: square;
  margin-left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resource-menu li:hover {
  cursor: pointer;
}

.resource-menu li.isActive {
  color: var(--peach-text);
}

/* Featured Items Styles */
.featured-items {
  min-height: 400px;
  background-color: #ffffff;
  border: 1px solid #000000;
  overflow: clip;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.featured-item-text {
  margin: 20px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.featured-item-text p {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.resource-item-img {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.resource-item-img img {
  height: 130px;
  width: 100%;
  object-fit: cover;
  object-position: center;
}

/* Engagement Specific Styles */
.our-engagements-page .resource-description {
  background-color: var(--peach-light);
}

.our-engagements-page .resource-scroll-section {
  background-color: var(--peach-light);
}

.our-engagements-page .resource-scroller {
  background-color: var(--peach-action);
}

.our-engagements-page .resource-image {
  background-image: url("/images/eel-image.png");
}

.our-engagements-page .resource-menu li.isActive {
  color: var(--peach-text);
}

.engagement_dot {
  height: 15px;
  width: 15px;
  background-color: red;
  border-radius: 50%;
  display: inline-block;
}

.event-tag-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 5px;
  height: 40px;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .our-engagements-page h1 {
    font-size: 30px;
    font-family: var(--font-habibi);
  }

  .resource-page {
    flex-wrap: wrap;
  }

  .resource-description {
    width: 100%;
  }

  .resource-scroll-section {
    display: flex;
    flex-direction: row;
    width: 90%;
    padding: 0;
    align-self: flex-end;
  }

  .resource-scroller {
    max-height: 1000px;
  }

  .resource-image {
    width: 10%;
    height: 1000px;
    align-self: flex-start;
    margin-left: 0;
  }

  .resource-item-img img {
    height: 112px;
  }

  .featured-items {
    width: 75vw;
    min-height: max-content;
    overflow: unset;
  }

  .featured-item-text {
    width: 100%;
    margin: 0;
    padding: 10px;
  }
}
</style>
