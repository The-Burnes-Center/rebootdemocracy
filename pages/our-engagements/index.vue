<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { format, isPast, isFuture } from "date-fns";
import { useRoute } from "vue-router";
import type { IndexData, ResourceItem } from "../../types/index.ts";

// State management
const route = useRoute();
const articleData = ref<ResourceItem[]>([]);
const indexData = ref<IndexData>({});
const selectedType = ref("All");
const path = ref(route.fullPath);
const isLoading = ref(true);
const dataFetchError = ref<string | null>(null);

// Import Directus client
const { directus, readItems } = useDirectusClient();

// Helper formatting functions
const formatDateTime = (d1: Date | string): string => {
  return format(new Date(d1), "MMMM d, yyyy, h:mm aa");
};

const formatDateOnly = (d1: Date | string): string => {
  return format(new Date(d1), "MMMM d, yyyy");
};

const isPastDate = (d1: Date | string): boolean => {
  return isPast(new Date(d1));
};

const isFutureDate = (d1: Date | string): boolean => {
  return isFuture(new Date(d1));
};

// Fetch index data from Directus - using hardcoded values if needed
const fetchIndex = async () => {
  try {
    // We'll try to fetch, but we already have default values
    const response = await directus.request(
      readItems("reboot_democracy", {
        meta: "total_count",
        limit: 1,
        fields: ["id", "engagement_title", "engagement_description"],
      })
    );

    const responseData = response as IndexData;

    if (responseData && responseData.id) {
      if (responseData.engagement_title) {
        indexData.value.engagement_title = responseData.engagement_title;
      }
      if (responseData.engagement_description) {
        indexData.value.engagement_description =
          responseData.engagement_description;
      }
    }
  } catch (error) {
    console.error("Error fetching index data:", error);
  }
};
// Fetch article data from Directus
const fetchArticle = async () => {
  try {
    const filter = {
      _or: [
        {
          type: {
            _eq: "Engagement",
          },
        },
      ],
    };

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

    // Check if we got any data
    if (response && Array.isArray(response)) {
      articleData.value = response as ResourceItem[];
    }
  } catch (error) {
    console.error("Error fetching article data:", error);
    articleData.value = [];
  }
};

// Load all data
const loadAllData = async () => {
  isLoading.value = true;
  dataFetchError.value = null;

  try {
    // Execute requests, but don't worry too much if index data fails
    await fetchIndex();
    await fetchArticle();
  } catch (error) {
    console.error("Error loading all data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle management
onMounted(() => {
  loadAllData();
});
</script>

<template>
  <div class="resource-page our-engagements-page">
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Loading content...</p>
    </div>
    <template v-else>
      <div class="resource-description">
        <h1>{{ indexData.engagement_title }}</h1>
        <p
          class="our-work-description"
          v-html="indexData.engagement_description"
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
          <div v-if="articleData.length === 0" class="no-content">
            <p>No engagements found.</p>
          </div>
          <template v-else v-for="item in articleData" :key="item.id">
            <div
              class="featured-items"
              v-show="item.type == selectedType || selectedType == 'All'"
            >
              <div class="featured-item-text">
                <div class="resource-item-img">
                  <img
                    v-if="item.thumbnail && item.thumbnail.id"
                    :src="
                      directus.url +
                      'assets/' +
                      item.thumbnail.id +
                      '?width=648'
                    "
                    alt="Engagement thumbnail"
                  />
                  <img
                    v-else
                    :src="
                      directus.url +
                      'assets/a23c4d59-eb04-4d2a-ab9b-74136043954c?quality=80'
                    "
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
  font-family: "Space Grotesk", sans-serif;
  font-size: 62.5px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -2.5px;
}

.our-engagements-page h4 {
  font-family: "Space Grotesk", sans-serif;
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
  font-family: "Red Hat Text", sans-serif;
  font-weight: 500;
  margin: 0;
  padding: 0;
}

.our-engagements-page .eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-family: "Space Mono", monospace;
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
  font-family: "Space Mono", monospace;
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
  font-family: "Red Hat Text", sans-serif;
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
  font-family: "Space Mono", monospace;
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
    font-family: "Space Mono", monospace;
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
