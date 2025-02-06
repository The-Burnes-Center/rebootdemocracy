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
 * date-fns imports (if you need these in your logic)
 */
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

/**
 * Components used in <template>
 */
import HeaderComponent from '../components/header.vue';
import FooterComponent from '../components/footer.vue';
import MailingListComponent from '../components/mailing.vue';

/**
 * Create Directus client
 */
const directus = createDirectus('https://dev.thegovlab.com').with(rest());

/**
 * Access the current route (if needed for path or similar)
 */
const route = useRoute();

/**
 * Reactive state (replacing data())
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
  // If needed: fillMeta(), or other tasks
});

/**
 * Watchers
 * e.g. watch selectedType to do something whenever it changes
 */
watch(selectedType, () => {
  // If you need to do something on type change (e.g. scroll up, reload data, etc.)
});

/**
 * Functions (replacing methods)
 */
function fillMeta(): void {
  // If you want to set meta tags with vueuse/head or similar:
  // useHead({
  //   title: 'Teaching Page',
  //   meta: [
  //     { name: 'title', content: 'Teaching Page' },
  //     { property: 'og:title', content: 'Teaching Page' },
  //     ...
  //   ],
  // });
}

/**
 * Format dates (optional)
 */
function formatDateTime(d1: Date | string): string {
  return format(new Date(d1), 'MMMM d, yyyy, h:mm aa');
}
function formatDateOnly(d1: Date | string): string {
  return format(new Date(d1), 'MMMM d, yyyy');
}
function PastDate(d1: Date | string): boolean {
  return isPast(new Date(d1));
}
function FutureDate(d1: Date | string): boolean {
  return isFuture(new Date(d1));
}

/**
 * Fetch data from Directus
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
      // For a single record, you might do:
      // indexData.value = response.data?.[0] ?? {};
      // But if your endpoint returns a single record anyway, adapt as needed
      indexData.value = response;
    })
    .catch((err: any) => {
      console.error('Error fetching index data:', err);
    });
}

function fetchArticle(): void {
  directus.request(
    readItems('reboot_democracy_resources', {
      meta: 'total_count',
      limit: -1,
      sort: ['-id'],
      fields: ['*.*'],
      filter: {
        _or: [
          { type: { _eq: 'Teaching' } },
        ],
      },
    })
  )
    .then((response: any) => {
      articleData.value = response || [];
    })
    .catch((err: any) => {
      console.error('Error fetching article data:', err);
    });
}
</script>

<template>
  <!-- Header Component -->
  <HeaderComponent />

  <div class="resource-page our-teaching-page">
    <div class="resource-description">
      <h1>{{ indexData.teaching_title }}</h1>
      <div 
        class="our-work-description" 
        v-html="indexData.teaching_description"
      ></div>

      <div class="resource-menu">
        <ul>
          <li
            @click="selectedType = 'All'"
            :class="{ isActive: selectedType === 'All' }"
          >
            All Teaching
          </li>
          <li
            @click="selectedType = 'at-your-own-pace'"
            :class="{ isActive: selectedType === 'at-your-own-pace' }"
          >
            At-Your-Own-Pace
          </li>
          <li
            @click="selectedType = 'video'"
            :class="{ isActive: selectedType === 'video' }"
          >
            Videos
          </li>
        </ul>
      </div>
    </div>

    <div class="resource-scroll-section">
      <div class="resource-scroller">
        <!-- Example usage of v-virtual-scroll: 
             Adjust the prop usage if your library differs. -->
        <v-virtual-scroll :items="articleData">
          <template #default="{ item }">
            <div
              class="featured-items"
              v-show="item.teaching_type === selectedType || selectedType === 'All'"
            >
              <div class="featured-item-text">
                <h5 class="eyebrow">{{ item.teaching_type }}</h5>
                <div class="resource-item-img">
                  <!-- Use directus.url.href for the full URL to assets -->
                  <img
                    v-if="item.thumbnail"
                    :src="directus.url.href + 'assets/' + item.thumbnail.id"
                    alt="Thumbnail"
                  />
                  <img
                    v-else
                    src="../assets/workplace-image.png"
                    alt="No thumbnail"
                  />
                </div>
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
                <a
                  class="btn btn-small btn-tertiary"
                  :href="item.link"
                  target="_blank"
                  rel="noopener"
                >
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
/* Your component-specific styles */
.resource-page.our-teaching-page {
  /* example styles */
}
</style>
