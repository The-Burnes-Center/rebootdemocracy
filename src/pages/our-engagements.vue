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
 * Component imports
 */
import HeaderComponent from '../components/header.vue';
import FooterComponent from '../components/footer.vue';
import MailingListComponent from '../components/mailing.vue';

/**
 * Create the Directus client
 */
const directus = createDirectus('https://content.thegovlab.com').with(rest());

/**
 * Access route if you need `route.fullPath`
 */
const route = useRoute();

/**
 * Reactive references (replacing data())
 */
const articleData = ref<any[]>([]);
const indexData = ref<any>({});
const selectedType = ref<string>('All');
/** 
 * If you need path from route:
 */
const path = ref<string>(route.fullPath || '');

/**
 * Lifecycle (replacing created()/mounted())
 */
onMounted(() => {
  fetchIndex();
  fetchArticle();
  // If needed: fillMeta(), register(), etc.
});

/**
 * Utility / meta / date functions
 */
function fillMeta(): void {
  // If you use vueuse/head or similar to set metadata:
  // useHead({
  //   title: 'Example Title',
  //   meta: [...],
  // });
}

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
 * Fetch data
 */
function fetchIndex(): void {
  directus
    .request(
      readItems('reboot_democracy', {
        meta: 'total_count',
        limit: -1,
        fields: ['*.*'],
      })
    )
    .then((response: any) => {
      // If the data is in response.data
      indexData.value = response;
    })
    .catch((err: any) => {
      console.error('Error fetching index data:', err);
    });
}

function fetchArticle(): void {
  directus
    .request(
      readItems('reboot_democracy_resources', {
        meta: 'total_count',
        limit: -1,
        sort: ['-id'],
        fields: ['*.*'],
        filter: {
          _or: [
            {
              type: {
                _eq: 'Engagement',
              },
            },
          ],
        },
      })
    )
    .then((response: any) => {
      articleData.value = response;
      console.log('Fetched article data:', response);
    })
    .catch((err: any) => {
      console.error('Error fetching article data:', err);
    });
}
</script>

<template>
  <!-- Header -->
  <HeaderComponent />

  <div class="resource-page our-engagements-page">
    <div class="resource-description">
      <h1>{{ indexData.engagement_title }}</h1>
      <div
        class="our-work-description"
        v-html="indexData.engagement_description"
      ></div>

      <div class="resource-menu">
        <ul>
          <li
            @click="selectedType = 'All'"
            :class="{ isActive: selectedType === 'All' }"
          >
            All Engagements
          </li>
        </ul>
      </div>
    </div>

    <div class="resource-scroll-section">
      <div class="resource-scroller">
        <template v-for="item in articleData" :key="item.id">
          <div
            class="featured-items"
            v-show="item.type === selectedType || selectedType === 'All'"
          >
            <div class="featured-item-text">
              <div class="resource-item-img">
                <!-- If item.thumbnail exists -->
                <img
                  v-if="item.thumbnail"
                  :src="directus.url.href + 'assets/' + item.thumbnail.id + '?width=648'"
                />
                <!-- If no thumbnail, fallback -->
                <img
                  v-else
                  :src="directus.url.href + 'assets/a23c4d59-eb04-4d2a-ab9b-74136043954c?quality=80'"
                />
              </div>

              <!-- Stage row -->
              <div class="event-tag-row" v-if="item.stage?.length > 0">
                <div class="engagement_dot"></div>
                <p>{{ item.stage?.[0] }}</p>
              </div>

              <h5 class="eyebrow peach">Partner: {{ item.partner }}</h5>
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
              <a class="btn btn-small btn-secondary" :href="item.link"
                >Details <i class="fa-regular fa-arrow-right"></i
              ></a>
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
/* Any specific component styles */
</style>
