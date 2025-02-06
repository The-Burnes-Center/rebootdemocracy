<script lang="ts" setup>
/**
 * Imports
 */
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Directus imports
 * - createDirectus: for creating the client
 * - rest: the REST plugin
 * - readItems: for readByQuery equivalents
 */
import { createDirectus, rest, readItems } from '@directus/sdk';

/**
 * Date-fns imports
 */
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

/* If needed:
import { useHead } from '@vueuse/head';
import { register } from 'swiper/element/bundle';
*/

// Components used in <template>
import HeaderComponent from '../components/header.vue';
import FooterComponent from '../components/footer.vue';
import MailingListComponent from '../components/mailing.vue';

/**
 * Create Directus client
 */
const directus = createDirectus('https://dev.thegovlab.com').with(rest());

/**
 * Access the current route
 */
const route = useRoute();

/**
 * Refs (replacing data())
 */
const articleData = ref<any[]>([]);
const indexData = ref<any>({}); // Since original indexData seemed to be a single object, not an array
const selectedType = ref<string>('All');
const path = ref<string>(route.fullPath);

/** 
 * A ref to the scrolling container 
 */
const resourceScrollerRef = ref<HTMLElement | null>(null);

/**
 * Lifecycle: onMounted
 */
onMounted(() => {
  fetchIndex();
  fetchArticle();
  // Optional: fillMeta(), register() ...
});

/**
 * Watchers
 *  - Example: watch selectedType if you need to do something on filter change
 */
watch(selectedType, () => {
  scrollTop();
});

/**
 * Functions (replacing methods)
 */
function fillMeta(): void {
  // Example if you want to set meta tags with vueuse/head
  // useHead({
  //   title: 'InnovateUS',
  //   meta: [
  //     { name: 'title', content: 'InnovateUS' },
  //     { property: 'og:title', content: 'InnovateUS' },
  //     {
  //       property: 'og:description',
  //       content:
  //         'InnovateUS provides no-cost, at-your-own pace, and live learning ...',
  //     },
  //     { property: 'og:image', content: 'https://innovate-us.org/innovateus_meta.jpg' },
  //     { property: 'twitter:title', content: 'InnovateUS' },
  //     { property: 'twitter:description', content: '...' },
  //     { property: 'twitter:image', content: 'https://innovate-us.org/innovateus_meta.jpg' },
  //     { property: 'twitter:card', content: 'summary_large_image' },
  //   ],
  // });
}

function formatDateTime(d1: Date): string {
  return format(d1, 'MMMM d, yyyy, h:mm aa');
}

function formatDateOnly(d1: Date): string {
  return format(d1, 'MMMM d, yyyy');
}

function PastDate(d1: Date | string): boolean {
  return isPast(new Date(d1));
}

function FutureDate(d1: Date | string): boolean {
  return isFuture(new Date(d1));
}

/**
 * Use the Directus client to fetch data 
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
      // If your original indexData was an array, store it in an array;
      // if it's a single record, adapt accordingly:
      // Example: if you're sure there's exactly 1 record, do response.data[0]
      console.log(response)
    //   if (Array.isArray(response) && response.length) {
        
        indexData.value = response;
    //   } else {
    //     indexData.value = {};
    //   }
    })
    .catch((err: any) => {
      console.error(err);
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
        type: {
          _eq: 'Case Study',
        },
      },
    })
  )
    .then((response: any) => {
        console.log(response)
      articleData.value = response;
    })
    .catch((err: any) => {
      console.error(err);
    });
}

function scrollTop(): void {
  if (resourceScrollerRef.value) {
    resourceScrollerRef.value.scrollTop = 0;
  }
}
</script>

<template>
  <!-- 
   Reproduce your original template, 
   removing "this." references and hooking up to Composition API 
  -->

  <!-- Header Component -->
  <HeaderComponent />

  <div class="resource-page our-research-page">
    <div class="resource-description">
      <h1>{{ indexData.research_title }}</h1>
      <div
        class="our-work-description"
        v-html="indexData.research_description"
      ></div>

      <div class="resource-menu">
        <ul>
          <li
            @click="selectedType = 'All'"
            :class="{ isActive: selectedType === 'All' }"
          >
            All Case Studies
          </li>
          <li
            @click="selectedType = 'CrowdLaw'"
            :class="{ isActive: selectedType === 'CrowdLaw' }"
          >
            CrowdLaw
          </li>
          <li
            @click="selectedType = 'Virtual Communities'"
            :class="{ isActive: selectedType === 'Virtual Communities' }"
          >
            Virtual Communities
          </li>
          <li
            @click="selectedType = 'Smarter State'"
            :class="{ isActive: selectedType === 'Smarter State' }"
          >
            Smarter State
          </li>
          <li
            @click="selectedType = 'Collective Intelligence'"
            :class="{ isActive: selectedType === 'Collective Intelligence' }"
          >
            Collective Intelligence
          </li>
          <li
            @click="selectedType = 'All'"
            :class="{ isActive: selectedType === '' }"
          >
            <a href="#research">Research Questions</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="resource-scroll-section">
      <div class="resource-scroller" ref="resourceScrollerRef">
        <template v-for="item in articleData" :key="item.id">
          <div
            class="featured-items"
            v-if="item.case_study_type === selectedType || selectedType === 'All'"
          >
            <div class="featured-item-text">
              <h5 class="eyebrow">{{ item.case_study_type }}</h5>
              <div class="resource-item-img">
                <img
                  v-if="item.thumbnail"
                  :src="directus.url.href + 'assets/' + item.thumbnail.id"
                  alt="Thumbnail"
                />
              </div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
              <a
                class="btn btn-small btn-blue"
                :href="item.link"
                target="_blank"
                rel="noopener"
              >
                Details <i class="fa-regular fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="resource-image"></div>
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

  <MailingListComponent />
  <FooterComponent />
</template>

<style scoped>
/* If you have specific styles */
</style>
