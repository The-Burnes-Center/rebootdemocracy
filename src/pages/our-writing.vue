<script lang="ts" setup>
/**
 * Imports
 */
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Directus imports
 * - createDirectus: for creating the client
 * - rest: the REST plugin
 * - readItems: for readByQuery equivalents
 */
import { createDirectus, rest, readItems } from '@directus/sdk';

/**
 * date-fns imports
 */
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

/**
 * Component imports
 */
import HeaderComponent from '../components/header.vue';
import FooterComponent from '../components/footer.vue';
import MailingListComponent from '../components/mailing.vue';

/**
 * Create the Directus client
 */
const directus = createDirectus('https://dev.thegovlab.com').with(rest());

/**
 * Access the current route if you need route info or path
 */
const route = useRoute();

/**
 * Reactive state (replacing data())
 * Note: if your `indexData` is supposed to be an array, change to ref<any[]>([])
 */
const articleData = ref<any[]>([]);
const indexData = ref<any>({});
const selectedType = ref<string>('All');
const path = ref<string>(route.fullPath || '');

/**
 * Lifecycle: onMounted
 */
onMounted(() => {
  fetchIndex();
  fetchArticle();
  // If needed: fillMeta(), register(), etc.
});

/**
 * Example watchers, if you want to do something when selectedType changes:
 */
watch(selectedType, () => {
  // E.g. reset scroll, etc.
});

/**
 * fillMeta
 * If you want to set page metadata with vueuse/head or similar
 */
function fillMeta(): void {
  // useHead({
  //   title: 'My Title',
  //   meta: [...],
  // });
}

/**
 * date-fns formatting
 */
function formatDateTime(d1: string | Date): string {
  return format(new Date(d1), 'MMMM d, yyyy, h:mm aa');
}

function formatDateOnly(d1: string | Date): string {
  return format(new Date(d1), 'MMMM d, yyyy');
}

function PastDate(d1: string | Date): boolean {
  return isPast(new Date(d1));
}

function FutureDate(d1: string | Date): boolean {
  return isFuture(new Date(d1));
}

/**
 * Fetch index data
 * 
 * IMPORTANT: You mentioned that your response does not contain .data
 * but directly has the fields you need. So we do `indexData.value = response`.
 */
function fetchIndex(): void {
  directus.request(
    readItems('reboot_democracy', {
      meta: 'total_count',
      limit: -1,
      fields: ['*.*'],
    })
  )
  .then((response: any) => {
    // If the entire record is in response, assign it directly
    // Adapt if you need, e.g. if response[0] is your actual data
    indexData.value = response;
  })
  .catch((err: any) => {
    console.error('Error in fetchIndex:', err);
  });
}

/**
 * Fetch article data
 * (Using filter to get type="Article" OR type="Book")
 */
function fetchArticle(): void {
  directus.request(
    readItems('reboot_democracy_resources', {
      meta: 'total_count',
      limit: -1,
      sort: ['-id'],
      fields: ['*.*', 'thumbnail.*', 'authors.team_id.*'],
      filter: {
        _or: [
          { type: { _eq: 'Article' } },
          { type: { _eq: 'Book' } },
        ],
      },
    })
  )
  .then((response: any) => {
    // As per your note, you have everything in `response` directly
    articleData.value = response;
  })
  .catch((err: any) => {
    console.error('Error in fetchArticle:', err);
  });
}
</script>

<template>
  <!-- Header Component -->
  <HeaderComponent />

  <div class="resource-page our-writing-page">
    <div class="resource-description">
      <!-- If indexData is an object with writing_title, display it -->
      <h1>{{ indexData.writing_title }}</h1>
      <div
        class="our-work-description"
        v-html="indexData.writing_description"
      ></div>
      <div class="resource-menu">
        <ul>
          <li
            @click="selectedType = 'All'"
            :class="{ isActive: selectedType === 'All' }"
          >
            All Writing
          </li>
          <li
            @click="selectedType = 'Book'"
            :class="{ isActive: selectedType === 'Book' }"
          >
            Books
          </li>
          <li
            @click="selectedType = 'Article'"
            :class="{ isActive: selectedType === 'Article' }"
          >
            Articles
          </li>
        </ul>
      </div>
    </div>

    <div class="resource-scroll-section">
      <div class="resource-scroller" ref="resourceScroller">
        <!-- Loop through articleData and show items that match the filter -->
        <template v-for="item in articleData" :key="item.id">
          <div
            class="featured-items"
            v-if="item.type === selectedType || selectedType === 'All'"
          >
            <div class="featured-item-text">
              <h5 class="eyebrow">{{ item.type }}</h5>
              <div class="resource-item-img">
                <img
                  v-if="item.thumbnail"
                  :src="directus.url.href + 'assets/' + item.thumbnail.id"
                  alt="thumbnail"
                />
                <img
                  v-else
                  src="../assets/workplace-image.png"
                  alt="no thumbnail"
                />
              </div>
              <h4>{{ item.title }}</h4>
              <p>
                By
                <span v-for="(author, index) in item.authors" :key="index">
                  {{ author.team_id.name }}
                  <span v-if="index < item.authors.length - 1">, </span>
                </span>
              </p>
              <a class="btn btn-small btn-blue" :href="item.link">
                Details <i class="fa-regular fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="resource-image"></div>
  </div>

  <MailingListComponent />
  <FooterComponent />
</template>

<style scoped>
/* Your styles here */
</style>
