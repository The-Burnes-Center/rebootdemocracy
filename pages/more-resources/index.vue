<script lang="ts" setup>
import { ref, computed} from "vue";
import { format, isPast, isFuture } from "date-fns";
import MailingListComponent from "../../components/mailing/Mailing.vue";
import { createDirectus, rest, readItems } from "@directus/sdk";
import { getImageUrl } from "@/composables/useImageUrl.js";
import { useSeoMeta } from '#imports';

// Directus client setup
const DIRECTUS_URL = "https://burnes-center.directus.app/";
const directus = createDirectus(DIRECTUS_URL).with(rest());

// Formatting utilities
const formatDateTime = (d: Date | string) =>
  format(new Date(d), "MMMM d, yyyy, h:mm aa");
const formatDateOnly = (d: Date | string) =>
  format(new Date(d), "MMMM d, yyyy");
const isPastDate = (d: Date | string) => isPast(new Date(d));
const isFutureDate = (d: Date | string) => isFuture(new Date(d));

// UI state
const selectedType = ref("All");
const resourceScroller = ref<HTMLElement | null>(null);
const scrollTop = () => {
  if (resourceScroller.value) resourceScroller.value.scrollTop = 0;
};

// Async fetch for index page metadata
const {
  data: indexData,
  pending: isIndexLoading,
  error: indexError,
} = await useAsyncData(
  "writing-index",
  async () => {
    const response = await directus.request(
      readItems("reboot_democracy", {
        meta: "total_count",
        limit: 1,
        fields: ["more_resources_title", "more_resources_description"],
      })
    );
    return Array.isArray(response) ? response[0] : response;
  },
  { server: true }
);

// Async fetch for articles
const {
  data: articleData,
  pending: isArticleLoading,
  error: articleError,
} = await useAsyncData(
  "writing-articles",
  async () => {
    const response = await directus.request(
      readItems("reboot_democracy_resources", {
        meta: "total_count",
        limit: -1,
        sort: ["-id"],
        fields: ["*.*", "thumbnail.*", "authors.team_id.*"],
        filter: {
          type: { _in: ["Resources", "Video", "Podcast"] },
        },
      })
    );
    return response;
  },
  { server: true }
);

const isLoading = computed(
  () => isIndexLoading.value || isArticleLoading.value
);
const dataFetchError = computed(() => indexError.value || articleError.value);
// SEO metadata
useSeoMeta({
  title: 'Resources - Reboot Democracy',
  ogTitle: 'Resources - Reboot Democracy',
  description: 'Explore our collection of resources, process documents, worksheets, podcasts, and videos on reimagining democracy with AI.',
  ogDescription: 'Explore our collection of resources, process documents, worksheets, podcasts, and videos on reimagining democracy with AI.',
  ogType: 'website',
  ogUrl: 'https://rebootdemocracy.ai/resources',
  ogImage: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3',
  twitterTitle: 'Resources - Reboot Democracy',
  twitterDescription: 'Explore our collection of resources, process documents, worksheets, podcasts, and videos on reimagining democracy with AI.',
  twitterImage: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3',
  twitterCard: 'summary_large_image'
});

</script>

<template>
  <div class="resource-page our-writing-page">
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Loading content...</p>
    </div>
    <div v-else-if="dataFetchError" class="error-message">
      <p>{{ dataFetchError }}</p>
    </div>
    <template v-else>
      <div class="resource-description">
        <h1>{{ indexData?.more_resources_title }}</h1>
        <div
          class="our-work-description"
          v-html="indexData?.more_resources_description || ''"
        ></div>
        <div class="resource-menu">
          <ul>
            <li
              @click="
                selectedType = 'All';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'All' }"
            >
              All Resources
            </li>
            <li
              @click="
                selectedType = 'Resources';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'Resources' }"
            >
              Process Docs and Worksheets
            </li>
            <li
              @click="
                selectedType = 'Podcast';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'Podcast' }"
            >
              Podcast
            </li>
            <li
              @click="
                selectedType = 'Video';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'Video' }"
            >
              Video
            </li>
          </ul>
        </div>
      </div>
      <div class="resource-scroll-section">
        <div class="resource-scroller" ref="resourceScroller">
          <div v-if="articleData?.length === 0" class="no-content">
            <p>No resources found.</p>
          </div>
          <div
            v-for="item in articleData"
            :key="item.id"
            class="featured-items"
            v-show="item.type === selectedType || selectedType === 'All'"
          >
            <div class="featured-item-text">
              <div class="resource-item-img">
                <img
                  v-if="item.thumbnail"
                  :src="getImageUrl(item.thumbnail)"
                  :alt="item.title || 'Resource thumbnail'"
                />
              </div>
              <h5 class="eyebrow peach">{{ item.type }}</h5>
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
              <a
                class="btn btn-small btn-secondary"
                :href="item.link"
                target="_blank"
                >Details <i class="fa-regular fa-arrow-right"></i
              ></a>
            </div>
          </div>
        </div>
      </div>
      <div class="resource-image"></div>
    </template>
  </div>
  <MailingListComponent />
</template>

<style>
/* Import fonts */
@import url("https://fonts.googleapis.com/css2?family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");

/* CSS Variables */
:root {
  --blue-action: #65d0f0;
  --peach-action: rgba(247, 158, 130, 1);
  --peach-light: rgba(255, 233, 229, 1);
  --peach-text: rgba(214, 53, 18, 1);
}

/* Typography Styles */
.resource-page h1 {
  font-family: var(--font-habibi);
  font-size: 62.5px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -2.5px;
  margin: 0;
  padding: 0;
}

.resource-page h2 {
  font-family: var(--font-habibi);
  margin: 0;
  padding: 0;
}

.resource-page h4 {
  font-family: var(--font-habibi);
  font-size: 18px;
  margin: 0;
  padding: 0;
}

.resource-page h5.eyebrow {
  width: fit-content;
  padding: 0.2em 0.5em;
  font-size: 0.7em;
  margin: 0;
}

.resource-page p,
.resource-page ul,
.resource-page li {
  font-family: var(--font-habibi);
  font-weight: 500;
  margin: 0;
  padding: 0;
  line-height: 1.5;
}

.resource-page .eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-family: var(--font-habibi);
  letter-spacing: 2.4px;
}

/* Button Styles */
.resource-page a.btn {
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

.resource-page a.btn:hover {
  cursor: pointer;
}

.resource-page .btn-blue {
  color: #ffffff;
  background: var(--blue-light);
}

.resource-page .btn-blue:hover {
  color: #ffffff;
  background: var(--blue-action);
}

.resource-page .btn-small {
  width: fit-content;
  padding: 0 15px;
  height: 35px;
  min-height: 35px;
}

.resource-page .btn-secondary {
  color: #000000;
  background: var(--peach-action);
  border: 1px solid #000000;
}

/* Loading and Error Styles */
.resource-page .loading,
.resource-page .error-message,
.resource-page .no-content {
  padding: 2rem;
  text-align: center;
  font-family: var(--font-habibi);
  font-weight: 500;
  width: 100%;
}

.resource-page .loading {
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.resource-page .error-message {
  color: #c8102e;
}

.resource-page .no-content {
  color: #666;
  font-style: italic;
}

/* Loader animation */
.resource-page .loader {
  width: 48px;
  height: 48px;
  border: 5px solid;
  border-color: var(--blue-action) transparent;
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

.resource-menu a {
  text-decoration: none;
}

.resource-menu a:visited {
  color: unset;
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

/* Our writing specific styles */
.our-writing-page .resource-description {
  background-color: var(--peach-light);
}

.our-writing-page .resource-scroll-section {
  background-color: var(--peach-light);
}

.our-writing-page .resource-scroller {
  background-color: var(--peach-action);
}

.our-writing-page .resource-image {
  background-image: url("/images/writing-image.png");
}

/* Responsive Styles */
@media (max-width: 768px) {
  .resource-page h1 {
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
