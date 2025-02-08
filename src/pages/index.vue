<script lang="ts" setup>
import { ref, watch, computed, onMounted, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';
import { createDirectus, rest, readItems } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
import _ from "lodash";
import { useHead } from '@vueuse/head';

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import ModalComp from "../components/modal.vue";
import { VueFinalModal } from 'vue-final-modal';

import { register } from 'swiper/element/bundle';
import 'vue-final-modal/style.css';

//////////////////////////////////////////
// 1. Single ASSET_BASE_URL variable
//////////////////////////////////////////
const ASSET_BASE_URL = import.meta.env.DEV
  ? 'https://dev.thegovlab.com/assets/'
  : 'https://ssg-test.rebootdemocracy.ai/assets/';

// Optional fallback if image is missing
const FALLBACK_ID = '4650f4e2-6cc2-407b-ab01-b74be4838235';

/**
 * Helper function to build an asset URL from Directus file object.
 * If file is missing, fallback is used. Pass width=0 if you don't want "?width=" param.
 */
function getAssetUrl(file: any, width = 800) {
  if (!file) {
    return ASSET_BASE_URL + FALLBACK_ID + (width ? `?width=${width}` : '');
  }
  const fileName = file.filename_disk || file.id;
  return ASSET_BASE_URL + fileName + (width ? `?width=${width}` : '');
}

//////////////////////////////////////////
// Existing code from your snippet below
//////////////////////////////////////////

// Check if we're on client-side
const isClient = typeof window !== 'undefined';
const route = isClient ? useRoute() : ref(null);

// Directus client
const directus = createDirectus('https://dev.thegovlab.com').with(rest());

// State variables
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
const filteredTagData = ref<string[]>([]);
const modalData = ref<any[]>([]);
const workshopData = ref<any[]>([]);
const playpause = ref<boolean>(true);
const showmodal = ref<boolean>(false);
const path = ref<string>(isClient ? route.value?.fullPath : '');
const slideautoplay = ref<number>(1);
const slidetransition = ref<number>(7000);
const slider = ref<any>('');
const wsloaded = ref<boolean>(false);
const ini = ref<boolean>(true);

// Debounce for search
debounceSearch.value = _.debounce(searchBlog, 500);

// Computed properties
const latestBlogPost = computed(() => {
  if (Array.isArray(blogData.value) && blogData.value.length > 0) {
    return [...blogData.value].reverse()[0];
  }
  return null;
});

const filteredTagDataWithoutNews = computed(() => {
  return filteredTagData.value.filter(tag => tag !== "News that caught our eye");
});

// Functions
function includesString(array: string[] | null, stringVal: string) {
  if (!array) return false;
  const lowerCasePartialSentence = stringVal.toLowerCase();
  return array.some(s => s.toLowerCase().includes(lowerCasePartialSentence));
}

function resetSearch() {
  blogDataSearch.value = [];
  searchResultsFlag.value = 0;
  searchTermDisplay.value = searchTerm.value;
  searchBlog();
}

function searchBlog() {
  searchloader.value = true;
  let searchTArray = searchTerm.value.split(" ").filter(item => item);
  const searchObj: any[] = [];

  searchTArray.map((a) => {
    searchObj.push({ excerpt: { _contains: a } });
    searchObj.push({ title: { _contains: a } });
    searchObj.push({ content: { _contains: a } });
    searchObj.push({ authors: { team_id: { First_Name: { _contains: a } } } });
    searchObj.push({ authors: { team_id: { Last_Name: { _contains: a } } } });
    searchObj.push({ authors: { team_id: { Title: { _contains: a } } } });
  });

  if (searchTArray.length > 0) {
    searchResultsFlag.value = 1;
  } else {
    searchResultsFlag.value = 0;
  }

  directus.request(
    readItems('reboot_democracy_blog', {
      limit: -1,
      filter: {
        _and: [{ date: { _lte: "$NOW(-5 hours)" } }, { status: { _eq: "published" } }],
        _or: searchObj
      },
      sort: ["date"],
      fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*']
    })
  ).then((b: any) => {
    blogDataSearch.value = b;
    searchloader.value = false;
  }).catch((err) => {
    console.error(err);
    searchloader.value = false;
  });
}

function formatDateTime(d1: Date) {
  return format(d1, 'MMMM d, yyyy, h:mm aa');
}
function formatDateOnly(d1: Date) {
  return format(d1, 'MMMM d, yyyy');
}
function PastDate(d1: Date) {
  return isPast(d1);
}
function FutureDate(d1: Date) {
  return isFuture(new Date(d1));
}

function loadModal() {
  directus.request(
    readItems('reboot_democracy_modal', {
      meta: 'total_count',
      limit: -1,
      fields: ['*.*']
    })
  ).then((item: any) => {
    modalData.value = item || {};
    let storageItem = (typeof window !== 'undefined') ? localStorage.getItem("Reboot Democracy") : null;
    showmodal.value = modalData.value.status == 'published' && 
      (modalData.value.visibility == 'always' || (modalData.value.visibility == 'once' && storageItem != 'off'));
  }).catch((err) => {
    console.error(err);
  });
}

function closeModal() {
  showmodal.value = false;
  if (typeof window !== 'undefined') {
    localStorage.setItem("Reboot Democracy", "off");
  }
}

async function fetchBlog() {
  try {
    const item = await directus.request(
      readItems('reboot_democracy_blog', {
        meta: 'total_count',
        limit: -1,
        filter: { status: { _eq: "published" } },
        fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*'],
        sort: ["date"]
      })
    );

    blogData.value = item;
    item.map((tag: any) => {
      tag?.Tags?.map((subTags: string) => {
        if (subTags != null && !includesString(filteredTagData.value, subTags)) {
          filteredTagData.value.push(subTags);
        }
      })
    })

    // Move "News that caught our eye" to the front if exists
    const newsIndex = filteredTagData.value.indexOf("News that caught our eye");
    if (newsIndex > -1) {
      filteredTagData.value.unshift(filteredTagData.value.splice(newsIndex, 1)[0]);
    }

  } catch (error) {
    console.error(error);
  }
}

function fillMeta() {
  useHead({
    title: "RebootDemocracy.AI",
    meta: [
      { name: 'title', content: "RebootDemocracy.AI" },
      { property: 'og:title', content: "RebootDemocracy.AI" },
      { property: 'og:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy...` },
      { property: 'og:image', content: "https://dev.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b" },
      { property: 'twitter:title', content: "RebootDemocracy.AI" },
      { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed...` },
      { property: 'twitter:image', content: "https://dev.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b" },
      { property: 'twitter:card', content: "summary_large_image" },
    ],
  })
}

// Watchers
watch(
  () => isClient ? route.value?.fullPath : '',
  () => {
    loadModal();
  },
  { immediate: true }
);

const isSSR = computed(() => import.meta.env.SSR);

// Lifecycle hooks
if (import.meta.env.SSR) {
  onServerPrefetch(async () => {
    await fetchBlog();
  });
} else {
  onMounted(async () => {
    fillMeta();
    register();
    await fetchBlog();
    resetSearch();
    loadModal();
    showmodal.value = true;
  });
}
</script>

<template>
  <div>
    <HeaderComponent></HeaderComponent>

    <!-- Modal -->
    <VueFinalModal
      v-if="showmodal"
      v-model="showmodal"
      classes="modal-container"
      class="modal-container"
      content-class="modal-comp"
    >
      <template v-slot:default="{ close }">
        <ModalComp
          :modalData="modalData"
          :closeFunc="() => { close(); closeModal(); }"
        />
      </template>
    </VueFinalModal>

    <!-- Hero Section -->
    <div class="blog-page-hero">
      <h1 class="eyebrow">Reboot Democracy</h1>
      <h1>Blog</h1>
      <p style="padding:1rem 0 0 0">The Reboot Democracy Blog explores the complex relationship among AI, democracy and governance.</p>
      <div class="search-bar-section">      
        <input
          class="search-bar"
          v-model="searchTerm"
          @keyup.enter="resetSearch()"
          type="text"
          placeholder="SEARCH"/>
            
        <span
          type="submit"
          @click="searchTerm = '';resetSearch();"
          class="search-bar-cancel-btn material-symbols-outlined">
            cancel
        </span>

        <span
          type="submit"
          @click="resetSearch()"
          class="search-bar-btn material-symbols-outlined">
            search
        </span>
      </div>
      <a href="/signup" class="btn btn-small btn-primary">Sign up for our newsletter</a>
    </div>

    <div v-if="searchloader" class="loader-blog"></div>

    <!-- Featured Blog Section -->
    <div class="blog-featured" v-if="!searchResultsFlag && searchTermDisplay === ''"> 
      <div class="blog-featured-row">
        <div class="first-blog-post" v-if="latestBlogPost">
          <a :href="'/blog/' + latestBlogPost.slug">
            <div v-if="!isSSR && latestBlogPost.image">
              <!-- Replacing directus.url.href with our getAssetUrl helper -->
              <img 
                class="blog-list-img" 
                :src="getAssetUrl(blogData.slice().reverse()[0].image, 800)"
                loading="lazy"
              >
            </div>
            <h3>{{ latestBlogPost.title }}</h3>
            <p>{{ latestBlogPost.excerpt }}</p>
            <p>Published on {{ formatDateOnly(new Date(latestBlogPost.date)) }}</p>
            <div class="author-list">
              <p class="author-name">{{ latestBlogPost.authors.length > 0 ? 'By' : '' }}</p>
              <div
                v-for="(author, i) in latestBlogPost.authors"
                :key="i"
                class="author-item"
              >
                <div class="author-details">
                  <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                  <!-- "and" logic if multiple authors -->
                  <p
                    class="author-name"
                    v-if="latestBlogPost.authors.length > 1 && i < latestBlogPost.authors.length - 1"
                  >
                    and
                  </p>
                </div>
              </div>
            </div>
          </a>  
        </div>
        
        <!-- Other blog posts -->
        <div class="other-blog-posts" v-if="!searchResultsFlag || searchTerm === ''">
          <div
            class="other-post-row"
            v-for="(blog_item, index) in blogData.slice().reverse()"
            :key="index"
            v-show="index > 0 && index < 4"
          > 
            <a :href="'/blog/' + blog_item.slug">
              <div v-if="!isSSR && blog_item.image">
                <img 
                  class="blog-list-img" 
                  :src="getAssetUrl(blog_item.image, 300)"
                  loading="lazy"
                >
              </div>
              <div class="other-post-details">
                <h3>{{ blog_item.title }}</h3>
                <p>{{ blog_item.excerpt }}</p>
                <p>Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
                <div class="author-list">
                  <p class="author-name">{{ blog_item.authors.length > 0 ? 'By' : '' }}</p>
                  <div
                    v-for="(author, i) in blog_item.authors"
                    :key="i"
                    class="author-item"
                  >
                    <div class="author-details">
                      <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                      <p
                        class="author-name"
                        v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1"
                      >
                        and
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- "Read All Posts" Button -->
    <div class="read-more-post" v-if="!searchResultsFlag && searchTermDisplay === ''">
      <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
    </div>

    <!-- Title for Latest Posts -->
    <div class="blog-section-header" v-if="!searchResultsFlag && searchTermDisplay === ''">
      <h2>Latest Posts</h2>
    </div>

    <!-- Latest Posts Grid -->
    <div v-if="!searchResultsFlag && searchTermDisplay === ''" class="allposts-section">
      <div
        class="allposts-post-row"
        v-for="(blog_item, index) in blogDataSearch.slice().reverse()"
        :key="index"
        v-show="index >= 4 && index < 16"
      >
        <a :href="'/blog/' + blog_item.slug">
          <div v-if="!isSSR && blog_item.image">
            <img
              class="blog-list-img"
              :src="getAssetUrl(blog_item.image, 300)"
              loading="lazy"
            >
          </div>
          <div class="allposts-post-details">
            <h3>{{ blog_item.title }}</h3>
            <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
            <div class="author-list">
              <p class="author-name">{{ blog_item.authors.length > 0 ? 'By' : '' }}</p>
              <div
                v-for="(author, i) in blog_item.authors"
                :key="i"
                class="author-item"
              >
                <div class="author-details">
                  <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                  <p
                    class="author-name"
                    v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1"
                  >
                    and
                  </p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </div>
      <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
    </div>

    <!-- Tag-based section, only if !searchResultsFlag || searchTerm === '' -->
    <div v-if="searchResultsFlag || searchTerm === ''">
      <div v-if="!searchResultsFlag && searchTermDisplay === ''">
        <div class="allposts-section">
          <div
            v-for="tag_item in filteredTagDataWithoutNews"
            :key="tag_item"
            class="all-posts-row"
          >
            <div class="blog-section-header">
              <h2>{{ tag_item }}</h2>
            </div>
            <div class="tag-posts-row-container">
              <div
                v-for="(blog_item, index) in blogDataSearch.slice().reverse()"
                :key="index"
                class="tag-posts-row"
              >
                <div v-if="includesString(blog_item?.Tags, tag_item)">
                  <a :href="'/blog/' + blog_item.slug">
                    <div v-if="!isSSR && blog_item.image">
                      <img
                        class="blog-list-img"
                        :src="getAssetUrl(blog_item.image, 300)"
                        loading="lazy"
                      >
                    </div>
                    <div class="allposts-post-details">
                      <h3>{{ blog_item.title }}</h3>
                      <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
                      <div class="author-list">
                        <p class="author-name">{{ blog_item.authors.length > 0 ? 'By' : '' }}</p>
                        <div
                          v-for="(author, i) in blog_item.authors"
                          :key="i"
                          class="author-item"
                        >
                          <div class="author-details">
                            <p class="author-name">
                              {{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}
                            </p>
                            <p
                              class="author-name"
                              v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1"
                            >
                              and
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Results Section -->
    <h2
      v-if="searchResultsFlag && searchTermDisplay !== ''"
      class="search-term"
    >
      Searching for <i>{{searchTermDisplay}}</i>
    </h2>
    <div
      v-if="searchResultsFlag && searchTermDisplay !== ''"
      class="allposts-section"
    >
      <div
        class="allposts-post-row"
        v-for="(blog_item, index) in blogDataSearch.slice().reverse()"
        :key="index"
      >
        <a :href="'/blog/' + blog_item.slug">
          <div v-if="!isSSR && blog_item.image">
            <img
              class="blog-list-img"
              :src="getAssetUrl(blog_item.image, 300)"
              loading="lazy"
            >
          </div>
          <div class="allposts-post-details">
            <h3>{{ blog_item.title }}</h3>
            <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
            <div class="author-list">
              <p class="author-name">{{ blog_item.authors.length>0 ? 'By' : '' }}</p>
              <div
                v-for="(author, i) in blog_item.authors"
                :key="i"
                class="author-item"
              >
                <div class="author-details">
                  <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                  <p
                    class="author-name"
                    v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1"
                  >
                    and
                  </p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </div>
      <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
    </div>

    <!-- Footer -->
    <FooterComponent></FooterComponent>
  </div>
</template>

<style scoped>
/* Your existing styles */
.image-placeholder {
  background-color: #f0f0f0;
  width: 100%;
  height: 200px;
}
</style>