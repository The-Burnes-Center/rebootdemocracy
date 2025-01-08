<script lang="ts" setup>
/**
 * Imports
 */
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { createDirectus, rest, readItems } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
import _ from "lodash";
import { register } from 'swiper/element/bundle';
import { useHead } from '@vueuse/head';

// /**
//  * Components (imported if needed in this file)
//  *
//  * e.g.:
//  * import HeaderComponent from "../components/header.vue";
//  * import FooterComponent from "../components/footer.vue";
//  */

 import HeaderComponent from "../components/header.vue";
//  import FooterComponent from "../components/footer.vue";

/** 
 * Directus client
 * (Replace with your older `new Directus('...')` if needed, 
 * but `createDirectus(...).with(rest())` is recommended for Directus v9+)
 */
const directus = createDirectus('https://content.thegovlab.com').with(rest());

/**
 * Route
 */
const route = useRoute();

/**
 * Reactive state (converted from data() in Options API)
 */
const searchResultsFlag = ref<number>(0);
const searchResults = ref<any[]>([]);
const searchTerm = ref<string>("");
const searchTermDisplay = ref<string>("");
const debounceSearch = ref<any>(null);
const searchloader = ref<boolean>(false);
const loadAPI = ref<boolean>(false);
const animateNext = ref<number>(0);
const currentDate = ref<string>('');
const prevItem = ref<number>(0);
const currentItem = ref<number>(1);
const nextItem = ref<number>(2);
const testimonialsLength = ref<number>(0);
const blogData = ref<any[]>([]);
const blogDataSearch = ref<any[]>([]);
const modalData = ref<any>([]);
const workshopData = ref<any[]>([]);
const playpause = ref<boolean>(true);
const showmodal = ref<boolean>(false);
const path = ref<string>(route.fullPath);
const slideautoplay = ref<number>(1);
const slidetransition = ref<number>(7000);
const slider = ref<any>('');
const wsloaded = ref<boolean>(false);
const ini = ref<boolean>(true);

/** 
 * Watch route changes 
 * (replaces watch: { '$route': { handler() { ... }, deep: true, immediate: true } })
 */
watch(
  () => route.fullPath,
  () => {
    loadModal();
  },
  { deep: true, immediate: true }
);

/**
 * Lifecycle: onMounted (replaces created() + mounted())
 */
onMounted(() => {
  loadModal();
  // In the original script, you set `this.blogData = this.directus.items(...)`, 
  // but that's not strictly necessary in Composition API. We'll just fetch here:
  fetchBlog();
  resetSearch();

  fillMeta();
  register(); // Initialize swiper
});

/**
 * Debounce for search (replaces this.debounceSearch = _.debounce(...))
 */
debounceSearch.value = _.debounce(searchBlog, 500);

/**
 * Methods → standalone functions
 */
function searchBlog(): void {
  searchloader.value = true;

  let searchTArray = searchTerm.value.split(" ");
  searchTArray = searchTArray.filter(item => item); // filter out empty entries

  // Build filter object
  const searchObj: any[] = [];
  searchTArray.forEach((a) => {
    searchObj.push({ excerpt: { _contains: a } });
    searchObj.push({ title: { _contains: a } });
    searchObj.push({ content: { _contains: a } });
    searchObj.push({ authors: { team_id: { First_Name: { _contains: a } } } });
    searchObj.push({ authors: { team_id: { Last_Name: { _contains: a } } } });
    searchObj.push({ authors: { team_id: { Title: { _contains: a } } } });
  });

  // Toggle searchResultsFlag
  if (searchTerm.value) {
    searchResultsFlag.value = 1;
  } else {
    searchResultsFlag.value = 0;
  }

  directus.request(
    readItems('reboot_democracy_blog', {
      limit: -1,
      filter: {
        _and: [
          { date: { _lte: "$NOW(-5 hours)" } },
          { status: { _eq: "published" } }
        ],
        _or: searchObj
      },
      sort: ["date"],
      fields: [
        '*.*',
        'authors.team_id.*',
        'authors.team_id.Headshot.*'
      ]
    })
  ).then((response: any) => {
    // Directus v9+ typically returns just array data or paginated object
    // Adjust if needed
    blogDataSearch.value = response;
    searchloader.value = false;
  }).catch((err: any) => {
    console.error('Error in searchBlog:', err);
    searchloader.value = false;
  });
}

function resetSearch(): void {
  blogDataSearch.value = [];
  searchResultsFlag.value = 0;
  searchTermDisplay.value = searchTerm.value;
  searchBlog();
}

function fillMeta(): void {
  // Using @vueuse/head to inject meta tags
  useHead({
    title: "RebootDemocracy.AI",
    meta: [
      { name: 'title', content: "RebootDemocracy.AI" },
      { property: 'og:title', content: "RebootDemocracy.AI" },
      {
        property: 'og:description',
        content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`
      },
      {
        property: 'og:image',
        content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"
      },
      { property: 'twitter:title', content: "RebootDemocracy.AI" },
      {
        property: 'twitter:description',
        content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`
      },
      {
        property: 'twitter:image',
        content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"
      },
      { property: 'twitter:card', content: "summary_large_image" },
    ],
  });
}

function loadModal(): void {
  directus.request(
    readItems('innovate_us_modal', {
      meta: 'total_count',
      limit: -1,
      fields: ['*.*']
    })
  ).then((item: any) => {
    // 'item.data' will be an array if multiple records exist
    // Adjust logic as needed if only one record is expected
    modalData.value = Array.isArray(item.data) ? item.data[0] : item.data;

    // If there's a "campaigns" object with "campaign_name" or similar
    const campaignName = modalData.value?.campaigns?.campaign_name || "ModalCampaign";
    const alreadyOff = (typeof window !== 'undefined')
      ? localStorage.getItem(campaignName) === 'off'
      : false;

    showmodal.value = (modalData.value?.status === 'published') && !alreadyOff;
  }).catch((err: any) => {
    console.error('Error loading modal:', err);
  });
}

function closeModal(): void {
  showmodal.value = false;

  // If there's a "campaigns" object with "campaign_name" or similar
  const campaignName = modalData.value?.campaigns?.campaign_name || "ModalCampaign";

  if (typeof window !== 'undefined') {
    localStorage.setItem(campaignName, "off");
  }

  // If you have a banner ref, you can do:
  // if (bannerRef.value?.slider.scrollLeft === 0) bannerRef.value.sliderPos();
}

function nextTestimonial(): void {
  if (nextItem.value <= testimonialsLength.value - 1) {
    prevItem.value++;
    currentItem.value++;
    nextItem.value++;
    // Toggle animateNext (boolean or 0/1)
    animateNext.value = animateNext.value ? 0 : 1;
  } else {
    prevItem.value = testimonialsLength.value - 2;
    currentItem.value = testimonialsLength.value - 1;
    nextItem.value = testimonialsLength.value;
  }
  console.log('nextTestimonial:', prevItem.value, currentItem.value, nextItem.value);
}

function prevTestimonial(): void {
  if (prevItem.value > -1) {
    prevItem.value--;
    currentItem.value--;
    nextItem.value--;
  } else {
    prevItem.value = -1;
    currentItem.value = 0;
    nextItem.value = 1;
  }
  console.log('prevTestimonial:', prevItem.value, currentItem.value, nextItem.value);
}

/**
 * date-fns wrappers
 */
function formatDateTime(d1: Date): string {
  return format(d1, 'MMMM d, yyyy, h:mm aa');
}
function formatDateOnly(d1: Date): string {
  return format(d1, 'MMMM d, yyyy');
}
function PastDate(d1: Date): boolean {
  return isPast(d1);
}
function FutureDate(d1: Date): boolean {
  return isFuture(new Date(d1));
}

/**
 * Fetch blog items from Directus
 */
function fetchBlog(): void {
  directus.request(
    readItems('reboot_democracy_blog', {
      meta: 'total_count',
      limit: 50,
      filter: {
        status: { _eq: "published" }
      },
      fields: [
        '*.*',
        'authors.team_id.*',
        'authors.team_id.Headshot.*'
      ],
      sort: ["date"]
    })
  ).then((response: any) => {
    // response.data will be your array of blog items
    blogData.value = response;
    console.log('Fetched blogData:', blogData.value);
  }).catch((err: any) => {
    console.error('Error fetching blog data:', err);
  });
}
</script>

<template>
  <!-- =====================================
       Keep your original template section
       ===================================== -->
  <!-- Header Component -->
  <HeaderComponent></HeaderComponent>
  <div class="blog-page-hero">
    <h1 class="eyebrow">Reboot Democracy</h1>
    <h1>All Posts</h1>
    <div class="search-bar-section">
      <input
        class="search-bar"
        v-model="searchTerm"
        @keyup.enter="resetSearch()"
        type="text"
        placeholder="SEARCH"
      />
      <span
        type="submit"
        @click="() => {
          searchTerm = '';
          resetSearch();
        }"
        class="search-bar-cancel-btn material-symbols-outlined"
      >
        cancel
      </span>
      <span
        type="submit"
        @click="resetSearch()"
        class="search-bar-btn material-symbols-outlined"
      >
        search
      </span>
    </div>
    <a href="/signup" class="btn btn-small btn-primary">Sign up</a>
  </div>

  <div v-if="searchloader" class="loader"></div>

  <div class="blog-section-header">
    <!-- <h2 v-if="!searchResultsFlag || searchTerm == ''">All Posts </h2> -->
    <h2 v-if="searchResultsFlag && searchTerm != ''">
      Searching for <i>{{ searchTermDisplay }}</i>
    </h2>
  </div>

  <div class="allposts-section">
    
    <div
        v-if="blogDataSearch"
      class="allposts-post-row"
      v-for="(blog_item, index) in blogDataSearch.slice().reverse()"
      :key="index"
    >
      <a :href="'/blog/' + blog_item.slug">
        <div class="allposts-post-details">
          <h3>{{ blog_item.title }}</h3>
          <p class="post-date">
            Published on {{ formatDateOnly(new Date(blog_item.date)) }}
          </p>
          <div class="author-list">
            <p class="author-name">
              {{ blog_item.authors.length > 0 ? 'By' : '' }}
            </p>
            <div
              v-for="(author, i) in blog_item.authors"
              :key="i"
              class="author-item"
            >
              <!-- <img class="author-headshot" :src="directus._url+'assets/'+author.team_id.Headshot.id"> -->
              <div class="author-details">
                <p class="author-name">
                  {{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}
                </p>
                <p
                  class="author-name"
                  v-if="
                    blog_item.authors.length > 1 &&
                    i < blog_item.authors.length - 1
                  "
                >
                  and
                </p>
              </div>
            </div>
          </div>
        </div>
        <!-- Replace directus._url usage with a known base URL or the `directus.url.href` from your code -->
        <img
          v-if="blog_item.image"
          class="blog-list-img"
          :src="
            'https://content.thegovlab.com/assets/' + blog_item.image.id+'?width=300'
          "
        />
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Your styles here (unchanged) */
</style>
