<script lang="ts" setup>
/**
 * Imports
 */
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { createDirectus, rest, readItems } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

/**
 * Components
 */
import HeaderComponent from '../components/header.vue';
import FooterComponent from '../components/footer.vue';
import MailingListComponent from '../components/mailing.vue';

/**
 * Create the Directus client
 */
const directus = createDirectus('https://content.thegovlab.com').with(rest());

/**
 * Access the current route if you need path info, etc.
 */
const route = useRoute();

/**
 * Reactive references (replacing data())
 */
const articleData = ref<any[]>([]);
const indexData = ref<any>({});
const selectedType = ref<string>('All');

/** If you still need the current path */
const path = ref<string>(route.fullPath || '');

/**
 * Lifecycle hook (replaces created() + mounted())
 */
onMounted(() => {
  // If needed, e.g. fillMeta(), register()...
  fetchIndex();
  fetchArticle();
});

/**
 * (Optional) fillMeta example
 */
function fillMeta(): void {
  // If you have vueuse/head, you can set meta tags here
  // useHead({
  //   title: 'My Resource Page',
  //   meta: [...],
  // });
}

/**
 * date-fns utility functions
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
 * Fetch data: indexData
 */
function fetchIndex(): void {
  directus.request(
    readItems('reboot_democracy', {
      meta: 'total_count',
      limit: -1,
      fields: ['*.*'],
    })
  )
  .then((res: any) => {
    // If your data is in res.data
    indexData.value = res || [];
  })
  .catch((err: any) => {
    console.error('Error fetching index data:', err);
  });
}

/**
 * Fetch data: articleData
 * (filtering on type = "Resources" OR "Video" OR "Podcast")
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
          { type: { _eq: 'Resources' } },
          { type: { _eq: 'Video' } },
          { type: { _eq: 'Podcast' } },
        ],
      },
    })
  )
  .then((res: any) => {
    articleData.value = res || [];
  })
  .catch((err: any) => {
    console.error('Error fetching article data:', err);
  });
}
</script>

<template>
  <!-- Header -->
  <HeaderComponent />

  <div class="resource-page our-writing-page">
    <div class="resource-description">
      <h1>{{ indexData.more_resources_title }}</h1>
      <div
        class="our-work-description"
        v-html="indexData.more_resources_description"
      ></div>
      <div class="resource-menu">
        <ul>
          <li
            @click="selectedType = 'All'"
            :class="{ isActive: selectedType === 'All' }"
          >
            All Resources
          </li>
          <li
            @click="selectedType = 'Resources'"
            :class="{ isActive: selectedType === 'Resources' }"
          >
            Process Docs and Worksheets
          </li>
          <li
            @click="selectedType = 'Podcast'"
            :class="{ isActive: selectedType === 'Podcast' }"
          >
            Podcast
          </li>
          <li
            @click="selectedType = 'Video'"
            :class="{ isActive: selectedType === 'Video' }"
          >
            Video
          </li>
        </ul>
      </div>
    </div>

    <div class="resource-scroll-section">
      <div class="resource-scroller">
        <!-- Example usage of v-virtual-scroll -->
        <v-virtual-scroll :items="articleData">
          <template #default="{ item }">
            <div
              class="featured-items"
              v-show="item.type === selectedType || selectedType === 'All'"
            >
              <div class="featured-item-text">
                <div class="resource-item-img">
                  <img
                    v-if="item.thumbnail"
                    :src="directus.url.href + 'assets/' + item.thumbnail.id"
                    alt="Thumbnail"
                  />
                </div>
                <h5 class="eyebrow peach">{{ item.type }}</h5>
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
                <a class="btn btn-small btn-secondary" :href="item.link">
                  Details <i class="fa-regular fa-arrow-right"></i>
                </a>
              </div>
            </div>
          </template>
        </v-virtual-scroll>
      </div>
    </div>
    <div class="resource-image"></div>
  </div>

  <MailingListComponent />
  <FooterComponent />
</template>

<style scoped>
/* Your page-specific styles here */
</style>
