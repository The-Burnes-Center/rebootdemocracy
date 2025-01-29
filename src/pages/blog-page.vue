<script lang="ts" setup>
import { ref, watch, computed, onMounted, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';
import { createDirectus, rest, readItems } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
import _ from "lodash";
import { useHead } from '@vueuse/head'

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import ModalComp from "../components/modal.vue";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal';

import { register } from 'swiper/element/bundle';
import 'vue-final-modal/style.css';

// Check if we're on client-side
const isClient = typeof window !== 'undefined';

const route = isClient ? useRoute() : ref(null);

// Directus client
const directus = createDirectus('https://content.thegovlab.com').with(rest());

// State variables
const searchTerm = ref<string>("");
const searchTermDisplay = ref<string>("");
const searchResultsFlag = ref<number>(0);
const searchloader = ref<boolean>(false);

const blogData = ref<any[]>([]);
const blogDataSearch = ref<any[]>([]);
const filteredTagData = ref<string[]>([]);

const showmodal = ref<boolean>(false);
const modalData = ref<any>({});

const debounceSearch = ref<any>(null);
debounceSearch.value = _.debounce(searchBlog, 500);

function formatDateOnly(d1: string | Date) {
  const dateObj = typeof d1 === 'string' ? new Date(d1) : d1;
  return format(dateObj, 'MMMM d, yyyy');
}

function includesString(array: string[] | null, stringVal: string) {
  if (!array) return false;
  const lowerCasePartial = stringVal.toLowerCase();
  return array.some(s => s.toLowerCase().includes(lowerCasePartial));
}

// Fetch blog posts
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

    // "item" may be an array
    blogData.value = Array.isArray(item) ? item : (item.data || []);

    // Collect tags
    blogData.value.forEach((blogEntry: any) => {
      if (Array.isArray(blogEntry.Tags)) {
        blogEntry.Tags.forEach((tg: string) => {
          if (tg && !includesString(filteredTagData.value, tg)) {
            filteredTagData.value.push(tg);
          }
        });
      }
    });

    // Move "News that caught our eye" to front if it exists
    const newsIndex = filteredTagData.value.indexOf("News that caught our eye");
    if (newsIndex > -1) {
      filteredTagData.value.unshift(filteredTagData.value.splice(newsIndex, 1)[0]);
    }
  } catch (error) {
    console.error('fetchBlog error:', error);
  }
}

// Search functionality
function searchBlog() {
  searchloader.value = true;
  const searchArray = searchTerm.value.trim().split(/\s+/).filter(Boolean);
  const searchObj: any[] = [];

  searchArray.forEach((word) => {
    searchObj.push({ excerpt: { _contains: word } });
    searchObj.push({ title: { _contains: word } });
    searchObj.push({ content: { _contains: word } });
    searchObj.push({ authors: { team_id: { First_Name: { _contains: word } } } });
    searchObj.push({ authors: { team_id: { Last_Name: { _contains: word } } } });
    searchObj.push({ authors: { team_id: { Title: { _contains: word } } } });
  });

  if (searchArray.length > 0) {
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
      fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*']
    })
  ).then((res: any) => {
    searchloader.value = false;
    blogDataSearch.value = Array.isArray(res) ? res : (res.data || []);
  }).catch((err) => {
    console.error('searchBlog error:', err);
    searchloader.value = false;
  });
}

// Modal
function loadModal() {
  directus.request(
    readItems('reboot_democracy_modal', {
      meta: 'total_count',
      limit: -1,
      fields: ['*.*']
    })
  ).then((item: any) => {
    // item might be an array
    const modalRecord = Array.isArray(item) ? item[0] : item;
    if (!modalRecord) return;

    modalData.value = modalRecord;
    if (typeof window !== 'undefined') {
      const storageItem = localStorage.getItem("Reboot Democracy");
      showmodal.value = (
        modalRecord.status === 'published' &&
        (modalRecord.visibility === 'always' ||
         (modalRecord.visibility === 'once' && storageItem !== 'off'))
      );
    }
  }).catch((err) => {
    console.error('loadModal error:', err);
  });
}
function closeModal() {
  showmodal.value = false;
  if (typeof window !== 'undefined') {
    localStorage.setItem("Reboot Democracy", "off");
  }
}

// SSR + meta tags
function fillMeta() {
  useHead({
    title: "RebootDemocracy.AI",
    meta: [
      { name: 'title', content: "RebootDemocracy.AI" },
      { property: 'og:title', content: "RebootDemocracy.AI" },
      // add more meta as needed
    ]
  });
}

// Lifecycle
onServerPrefetch(async () => {
  // For SSR
  await fetchBlog();
  loadModal();
});
onMounted(async () => {
  // For client side
  await fetchBlog();
  loadModal();
  fillMeta();
});
</script>

<template>
  <div class="container container-main">
    <HeaderComponent />
    <ModalComp :showmodal="showmodal" @closeModal="closeModal" :data="modalData" />
    <div class="blog-section">
      <!-- SEARCH FORM -->
      <div class="search-container">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search blog..."
          @input="debounceSearch()"
        />
        <button class="btn" @click="searchBlog">
          Search
        </button>
      </div>

      <!-- LOADING SPINNER -->
      <div v-if="searchloader" class="search-loader">
        <p>Searching...</p>
      </div>

      <!-- If not searching, show some featured posts -->
      <div v-if="!searchResultsFlag && searchTerm.trim() === ''">
        <h2>Featured Post</h2>
        <!-- Safely check the first/last item. Example: the last item is the newest if sorted by date -->
        <div v-if="blogData.value && blogData.value.length > 0">
          <div class="featured-post" :key="blogData.value[blogData.value.length - 1].slug">
            <a 
              :href="'/blog/' + blogData.value[blogData.value.length - 1].slug"
              v-if="blogData.value[blogData.value.length - 1]"
            >
              <!-- Safe check for .image -->
              <div v-if="blogData.value[blogData.value.length - 1].image">
                <img
                  class="blog-list-img"
                  :src="directus.url.href + 'assets/' + blogData.value[blogData.value.length - 1].image.filename_disk + '?width=600'"
                  loading="lazy"
                >
              </div>
              <h3>{{ blogData.value[blogData.value.length - 1].title }}</h3>
              <p>{{ blogData.value[blogData.value.length - 1].excerpt }}</p>
              <p>
                Published on
                {{ formatDateOnly(blogData.value[blogData.value.length - 1].date) }}
              </p>

              <div class="author-list" v-if="blogData.value[blogData.value.length - 1].authors && blogData.value[blogData.value.length - 1].authors.length > 0">
                <p class="author-name">By</p>
                <div
                  v-for="(author, i) in blogData.value[blogData.value.length - 1].authors"
                  :key="author?.team_id?.id || i"
                  class="author-item"
                >
                  <div class="author-details">
                    <p class="author-name">
                      {{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}
                    </p>
                    <p class="author-name" v-if="blogData.value[blogData.value.length - 1].authors.length > 1 && i < blogData.value[blogData.value.length - 1].authors.length - 1">
                      and
                    </p>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>

        <!-- Show a few more recent posts -->
        <h2>Other Recent Posts</h2>
        <div class="other-blog-posts">
          <div
            class="other-post-row"
            v-for="(blog_item, index) in [...blogData.value].reverse()"
            :key="blog_item.slug"
            v-if="index < 4"
          >
            <a :href="'/blog/' + blog_item.slug">
              <div v-if="blog_item.image">
                <img
                  class="blog-list-img"
                  :src="directus.url.href + 'assets/' + blog_item.image.filename_disk + '?width=300'"
                  loading="lazy"
                >
              </div>
              <div class="other-post-details">
                <h3>{{ blog_item.title }}</h3>
                <p>{{ blog_item.excerpt }}</p>
                <p>Published on {{ formatDateOnly(blog_item.date) }}</p>
                <div class="author-list" v-if="blog_item.authors && blog_item.authors.length > 0">
                  <p class="author-name">By</p>
                  <div 
                    v-for="(author,i) in blog_item.authors" 
                    :key="author?.team_id?.id || i"
                    class="author-item"
                  >
                    <div class="author-details">
                      <p class="author-name">
                        {{author.team_id.First_Name}} {{author.team_id.Last_Name}}
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

      <!-- If search is triggered -->
      <div v-else-if="searchResultsFlag || searchTerm.trim() !== ''">
        <h2 v-if="searchTermDisplay" class="search-term">
          Searching for <i>{{ searchTermDisplay }}</i>
        </h2>

        <!-- Show search results -->
        <div 
          class="allposts-section"
          v-if="blogDataSearch.value && blogDataSearch.value.length > 0"
        >
          <div 
            class="allposts-post-row"
            v-for="(blog_item, index) in [...blogDataSearch.value].reverse()"
            :key="blog_item.slug"
          >
            <a :href="'/blog/' + blog_item.slug">
              <div v-if="blog_item.image">
                <img
                  class="blog-list-img"
                  :src="directus.url.href + 'assets/' + blog_item.image.filename_disk + '?width=300'"
                  loading="lazy"
                >
              </div>
              <div class="allposts-post-details">
                <h3>{{ blog_item.title }}</h3>
                <p class="post-date">
                  Published on {{ formatDateOnly(blog_item.date) }}
                </p>
                <div class="author-list" v-if="blog_item.authors && blog_item.authors.length > 0">
                  <p class="author-name">By</p>
                  <div 
                    v-for="(author, i) in blog_item.authors"
                    :key="author?.team_id?.id || i"
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

        <!-- If no results found -->
        <div v-else>
          <p>No results found.</p>
        </div>
      </div>

      <!-- "Read all" link if not searching -->
      <div class="read-more-post" v-if="!searchResultsFlag && searchTerm.trim() === ''">
        <a href="/all-blog-posts" class="btn btn-small btn-primary">
          Read All Posts
        </a>
      </div>
    </div>

    <FooterComponent />
  </div>
</template>

<style scoped>
/* Your existing styles. Example: */
.image-placeholder {
  background-color: #f0f0f0;
  width: 100%;
  height: 200px;
}
</style>