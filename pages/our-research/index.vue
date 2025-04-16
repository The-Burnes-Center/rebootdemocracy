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

// Reference for the scroller div
const resourceScroller = ref<HTMLElement | null>(null);

// Fetch index data from Directus
const fetchIndex = async () => {
  try {
    // Add explicit type for the response
    const response = (await directus.request(
      readItems("reboot_democracy", {
        meta: "total_count",
        limit: 1,
        fields: [
          "research_title",
          "research_description",
          "research_questions_description",
          "research_questions_content",
        ],
      })
    )) as IndexData;

    // Directly assign the response to indexData
    if (response) {
      indexData.value = { ...response };
    }
  } catch (error) {
    console.error("Error fetching index data:", error);
  }
};

// Fetch article data from Directus
const fetchArticle = async () => {
  try {
    const filter = {
      type: {
        _eq: "Case Study",
      },
    };

    const response = await directus.request(
      readItems("reboot_democracy_resources", {
        meta: "total_count",
        limit: -1,
        sort: ["-id"],
        fields: [
          "id",
          "case_study_type",
          "thumbnail.id",
          "thumbnail.filename_disk",
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

// Scroll to top function
const scrollTop = () => {
  if (resourceScroller.value) {
    resourceScroller.value.scrollTop = 0;
  }
};

// Load all data
const loadAllData = async () => {
  isLoading.value = true;
  dataFetchError.value = null;

  try {
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
  <!-- Header Component -->
  <HeaderComponent />
  <div class="resource-page our-research-page">
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Loading content...</p>
    </div>
    <template v-else>
      <div class="resource-description">
        <h1>{{ indexData.research_title }}</h1>
        <p
          class="our-work-description"
          v-html="indexData.research_description"
        ></p>
        <div class="resource-menu">
          <ul>
            <li
              @click="
                selectedType = 'All';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'All' }"
            >
              All Case Studies
            </li>
            <li
              @click="
                selectedType = 'CrowdLaw';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'CrowdLaw' }"
            >
              CrowdLaw
            </li>
            <li
              @click="
                selectedType = 'Virtual Communities';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'Virtual Communities' }"
            >
              Virtual Communities
            </li>
            <li
              @click="
                selectedType = 'Smarter State';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'Smarter State' }"
            >
              Smarter State
            </li>
            <li
              @click="
                selectedType = 'Collective Intelligence';
                scrollTop();
              "
              :class="{ isActive: selectedType == 'Collective Intelligence' }"
            >
              Collective Intelligence
            </li>
            <li
              @click="
                selectedType = 'All';
                scrollTop();
              "
              :class="{ isActive: selectedType == '' }"
            >
              <a href="#research">Research Questions</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="resource-scroll-section">
        <div class="resource-scroller" ref="resourceScroller">
          <div v-if="articleData.length === 0" class="no-content">
            <p>No case studies found.</p>
          </div>
          <template v-else v-for="item in articleData" :key="item.id">
            <div
              class="featured-items"
              v-if="
                item.case_study_type == selectedType || selectedType == 'All'
              "
            >
              <div class="featured-item-text">
                <h5 class="eyebrow">{{ item.case_study_type }}</h5>
                <div class="resource-item-img">
                  <img
                    v-if="item.thumbnail"
                    :src="getImageUrl(item.thumbnail)"
                    alt="Case study thumbnail"
                  />
                </div>
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
                <a
                  class="btn btn-small btn-blue"
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
  <div id="research" class="research-questions">
    <div class="research-questions-description">
      <h2>Research Questions</h2>
      <div v-html="indexData.research_questions_description"></div>
    </div>
    <div
      class="research-questions-content"
      v-html="indexData.research_questions_content"
    ></div>
  </div>
  <Mailing />
  <FooterComponent />
</template>

<style scoped>
/* Import fonts */
@import url("https://fonts.googleapis.com/css2?family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");

/* CSS Variables */
:root {
  --yellow-light: rgba(255, 235, 205, 1);
  --yellow-action: rgba(255, 180, 70, 1);
  --yellow-icon: rgba(255, 215, 156, 1);
  --yellow-rich: rgba(36, 21, 0, 1);
  --blue-text: rgba(0, 120, 156, 1);
  --blue-light: rgba(224, 248, 255, 1);
  --blue-action: #65d0f0;
  --blue-rich: rgba(1, 42, 55, 1);
  --peach-action: rgba(247, 158, 130, 1);
  --peach-light: rgba(255, 233, 229, 1);
  --peach-rich: #5c1c00;
  --peach-text: rgba(214, 53, 18, 1);
  --peach-icon: rgba(246, 190, 182, 1);
  --purple-icon: rgba(219, 198, 254, 1);
  --teal-light: rgba(218, 250, 235, 1);
  --teal-action: #0bcac4;
  --teal-text: rgba(4, 120, 127, 1);
}

/* Typography Styles */
h1 {
  font-family: "Space Grotesk", sans-serif;
  font-size: 62.5px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -2.5px;
  margin: 0;
  padding: 0;
}

h2 {
  font-family: "Space Grotesk", sans-serif;
  margin: 0;
  padding: 0;
}

h4 {
  font-family: "Space Grotesk", sans-serif;
  font-size: 18px;
  margin: 0;
  padding: 0;
}

h5.eyebrow {
  width: fit-content;
  padding: 0.2em 0.5em;
  font-size: 0.7em;
  margin: 0;
}

p,
ul,
li {
  font-family: "Red Hat Text", sans-serif;
  font-weight: 500;
  margin: 0;
  padding: 0;
  line-height: 1.5;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-family: "Space Mono", monospace;
  letter-spacing: 2.4px;
}

/* Button Styles */
a.btn {
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

a.btn:hover {
  cursor: pointer;
}

.btn-blue {
  color: #ffffff;
  background: var(--blue-light);
}

.btn-blue:hover {
  color: #ffffff;
  background: var(--blue-action);
}

.btn-small {
  width: fit-content;
  padding: 0 15px;
  height: 35px;
  min-height: 35px;
}

/* Loading and Error Styles */
.loading,
.error-message,
.no-content {
  padding: 2rem;
  text-align: center;
  font-family: "Red Hat Text", sans-serif;
  font-weight: 500;
  width: 100%;
}

.loading {
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.error-message {
  color: #c8102e;
}

.no-content {
  color: #666;
  font-style: italic;
}

/* Loader animation */
.loader {
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

.resource-menu a {
  text-decoration: none;
}

.resource-menu a:visited {
  color: unset;
}

.resource-menu li:hover {
  cursor: pointer;
}

/* Research specific styles */
.our-research-page .resource-description {
  background-color: var(--blue-light);
}

.our-research-page .resource-scroll-section {
  background-color: var(--blue-light);
}

.our-research-page .resource-scroller {
  background-color: var(--blue-action);
}

.our-research-page .resource-image {
  background-image: url("/images/research-image.png");
}

.our-research-page .resource-menu li.isActive {
  color: var(--blue-text);
}

/* Research questions section */
.research-questions {
  background-color: var(--teal-light);
  display: flex;
  flex-direction: row;
  padding: 2rem 5rem;
  gap: 6rem;
}

.research-questions-description {
  width: 50%;
}

.research-questions-description p{
    line-height: 1.5;
}

.research-questions-content {
  width: 50%;
}

/* For Vue 3 */
:deep(.research-questions-content ol) {
  background-color: #ffffff !important;
  border: 1px solid #000000;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 2rem 4rem;
  line-height: 2;
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

/* Responsive Styles */
@media (max-width: 768px) {
  h1 {
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

  .research-questions {
    flex-direction: column;
    padding: 2rem;
    gap: 2rem;
  }

  .research-questions-description {
    width: 100%;
  }

  .research-questions-content {
    width: 100%;
  }
}
</style>
