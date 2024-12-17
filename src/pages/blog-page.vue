<script lang="ts" setup>
import { ref, watch, computed, onMounted, onServerPrefetch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { createDirectus, rest, readItems } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
import _ from "lodash";

import { useHead } from '@vueuse/head'
import { lazyLoad } from '../directives/lazyLoad';

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import ModalComp from "../components/modal.vue";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal';
import OpenAIChat from "../components/pschat.vue";
import { register } from 'swiper/element/bundle';

const route = useRoute();

// Directus client
const directus = createDirectus('https://dev.thegovlab.com').with(rest());

// State variables (replaces data())
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
const path = ref<string>(route.fullPath);
const slideautoplay = ref<number>(1);
const slidetransition = ref<number>(7000);
const slider = ref<any>('');
const wsloaded = ref<boolean>(false);
const ini = ref<boolean>(true);

// Set up debounce for search
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

// Functions (replaces methods)
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
    modalData.value = item;
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
      { property: 'og:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` },
      { property: 'og:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b" },
      { property: 'twitter:title', content: "RebootDemocracy.AI" },
      { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.` },
      { property: 'twitter:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b" },
      { property: 'twitter:card', content: "summary_large_image" },
    ],
  })
}

// Watchers
watch(() => route.fullPath, () => {
  loadModal();
}, { immediate: true });


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
  });
}

// Register directives locally if needed
// Note: If the directive is global, remove this registration or adapt accordingly.
const directives = {
  lazyLoad
};

</script>

<template>
  <div>
    <!-- Header Component -->
    <header-comp></header-comp>

    <vue-final-modal v-if="showmodal" @before-close="closeModal" v-model="showmodal" classes="modal-container" content-class="modal-comp">
      <ModalComp :modalData="modalData" @close="closeModal" />
    </vue-final-modal>

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
            
        <span type="submit"
          @click="searchTerm = '';resetSearch();"
          class="search-bar-cancel-btn material-symbols-outlined">
            cancel
        </span>

        <span type="submit"
          @click="resetSearch()"
          class="search-bar-btn material-symbols-outlined">
            search
        </span>
      </div>
      <a href="/signup" class="btn btn-small btn-primary">Sign up for our newsletter</a>
    </div>

    <div v-if="searchloader" class="loader-blog"></div>

    <!-- Featured Blog Section -->
    <div class="blog-featured" v-if="!searchResultsFlag && searchTermDisplay == ''"> 
      <div class="blog-featured-row">
        <div class="first-blog-post" v-if="latestBlogPost">
          <a :href="'/blog/' + latestBlogPost.slug">
            <div v-lazy-load>
              <img v-if="latestBlogPost.image" class="blog-list-img" :data-src="directus.url.href+'assets/'+ blogData.slice().reverse()[0].image.id+'?width=800'">
            </div>
            <h3>{{latestBlogPost.title}}</h3>
            <p>{{ latestBlogPost.excerpt }}</p>
            <p>Published on {{ formatDateOnly(new Date(latestBlogPost.date)) }}</p>
            <div class="author-list">
              <p class="author-name">{{latestBlogPost.authors.length>0?'By':''}}</p>
              <div v-for="(author,i) in latestBlogPost.authors" :key="i" class="author-item">               
                <div class="author-details">
                  <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                  <p class="author-name" v-if="latestBlogPost.authors.length > 1 && i < blogData.slice().reverse()[0].authors.length - 1">and</p>
                </div>
              </div>
            </div>
          </a>  
        </div>
        <div class="other-blog-posts" v-if="!searchResultsFlag  || searchTerm == ''">
          <div class="other-post-row" v-for="(blog_item,index) in blogData.slice().reverse()"  :key="index" v-show="index > 0 && index < 4"> 
            <a :href="'/blog/' + blog_item.slug">
              <div v-lazy-load>
                <img v-if="blog_item.image" class="blog-list-img" :data-src="directus.url.href+'assets/'+ blog_item.image.id">
              </div>
              <div class="other-post-details">
                <h3>{{blog_item.title}}</h3>
                <p>{{ blog_item.excerpt }}</p>
                <p>Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
                <div class="author-list">
                  <p class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
                  <div v-for="(author,i) in blog_item.authors" :key="i" class="author-item">
                    <div class="author-details">
                      <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                      <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="read-more-post" v-if="!searchResultsFlag && searchTermDisplay == ''">
      <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
    </div>

    <!-- Latest Posts -->
    <div class="blog-section-header" v-if="!searchResultsFlag && searchTermDisplay == ''">
      <h2>Latest Posts </h2>
    </div>

    <div v-if="!searchResultsFlag && searchTermDisplay == ''"  class="allposts-section">
      <div class="allposts-post-row" v-for="(blog_item, index) in blogDataSearch.slice().reverse()" :key="index" v-show="index >= 4 && index < 16">
        <a :href="'/blog/' + blog_item.slug">
          <div v-lazy-load>
            <img v-if="blog_item.image" class="blog-list-img" :data-src="directus.url.href+'assets/'+ blog_item.image.id">
          </div>
          <div class="allposts-post-details">
            <h3>{{blog_item.title}}</h3>
            <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
            <div class="author-list">
              <p class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
              <div v-for="(author,i) in blog_item.authors" :key="i" class="author-item">
                <div class="author-details">
                  <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                  <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </div>
      <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
    </div>

    <!-- Filtered Posts Section -->
    <h2 v-if="searchResultsFlag && searchTermDisplay != ''" class="search-term">Searching for <i>{{searchTermDisplay}}</i></h2>
    <div v-if="searchResultsFlag || searchTerm == ''">
      <div v-if="!searchResultsFlag && searchTermDisplay == ''">
        <div class="allposts-section">
          <div v-for="tag_item in filteredTagDataWithoutNews" :key="tag_item" class="all-posts-row">
            <div class="blog-section-header">
              <h2>{{ tag_item }}</h2>
            </div>
            <div class="tag-posts-row-container">
              <div v-for="(blog_item, index) in blogDataSearch.slice().reverse()" :key="index" class="tag-posts-row">
                <div v-if="includesString(blog_item?.Tags, tag_item)">
                  <a :href="'/blog/' + blog_item.slug">
                    <div v-lazy-load>
                      <img v-if="blog_item.image" class="blog-list-img" :data-src="directus.url.href + 'assets/' + blog_item.image.id">
                    </div>
                    <div class="allposts-post-details">
                      <h3>{{blog_item.title}}</h3>
                      <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
                      <div class="author-list">
                        <p class="author-name">{{blog_item.authors.length > 0 ? 'By' : ''}}</p>
                        <div v-for="(author, i) in blog_item.authors" :key="i" class="author-item">
                          <div class="author-details">
                            <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                            <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
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

    <!-- Search section -->
    <div  v-if="searchResultsFlag && searchTermDisplay != ''" class="allposts-section">
      <div class="allposts-post-row" v-for="(blog_item, index) in blogDataSearch.slice().reverse()" :key="index"> 
        <a :href="'/blog/' + blog_item.slug">
          <div v-lazy-load>
            <img v-if="blog_item.image" class="blog-list-img" :data-src="directus.url.href+'assets/'+ blog_item.image.id">
          </div>
          <div class="allposts-post-details">
            <h3>{{blog_item.title}}</h3>
            <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }} </p>
            <div class="author-list">
              <p class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
              <div v-for="(author,i) in blog_item.authors" :key="i" class="author-item">
                <div class="author-details">
                  <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                  <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </div>
      <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
    </div>

    <!-- Footer Component -->
    <footer-comp></footer-comp>
  </div>
</template>

<style scoped>
/* Your styles here */
</style>
