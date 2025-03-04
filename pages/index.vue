<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { createDirectus, rest, readItems } from '@directus/sdk'
import format from 'date-fns/format'
import _ from 'lodash'
import { useHead, useAsyncData } from '#imports'
import HeaderComponent from '../components/header.vue'
import FooterComponent from '../components/footer.vue'
import ModalComp from '~/components/modal.vue'
// import { VueFinalModal } from 'vue-final-modal'

const directus = createDirectus('https://dev.thegovlab.com').with(rest())

// STATE VARIABLES
const blogData = ref([])
const blogDataSearch = ref([])
const modalData = ref({})
const showmodal = ref(false)
const searchTerm = ref('')
const searchTermDisplay = ref('')
const searchloader = ref(false)
const searchResultsFlag = ref(0)
const filteredTagData = ref([])

// COMPUTED PROPERTIES
const latestBlogPost = computed(() => blogData.value[0])
const filteredTagDataWithoutNews = computed(() =>
  filteredTagData.value.filter(tag => tag !== "News that caught our eye")
)

// HELPER FUNCTIONS
async function getAssetUrl(file: any, width = 800) {
  const REMOTE_ASSET_BASE_URL = 'https://dev.thegovlab.com/assets/';
  const LOCAL_ASSET_BASE_URL = '/images/';
  const FALLBACK_ID = '4650f4e2-6cc2-407b-ab01-b74be4838235';

  // When there is no file, download the fallback image on the server if necessary.
  if (!file) {
    if (process.server && !process.dev) {
      const { downloadAndStoreImage } = await import('~/server/download-image');
      // Download the fallback image and get its local path.
      const localFallbackImagePath = await downloadAndStoreImage(`${REMOTE_ASSET_BASE_URL}${FALLBACK_ID}`);
      return `/${localFallbackImagePath}?width=${width}`;
    }
    return `${process.dev ? REMOTE_ASSET_BASE_URL : LOCAL_ASSET_BASE_URL}${FALLBACK_ID}?width=${width}`;
  }

  // If a file is provided, use its filename
  const fileName = file.filename_disk || file.id;
  if (process.server && !process.dev) {
    const { downloadAndStoreImage } = await import('~/server/download-image');
    const localImagePath = await downloadAndStoreImage(`${REMOTE_ASSET_BASE_URL}${fileName}`);
    return `/${localImagePath}?width=${width}`;
  } else {
    return `${REMOTE_ASSET_BASE_URL}${fileName}?width=${width}`;
  }
}

// FETCH BLOG DATA AT BUILD TIME AND RESOLVE IMAGE URLS
const { data: fetchedBlogData } = await useAsyncData('blogData', async () => {
  const posts = await directus.request(readItems('reboot_democracy_blog', {
    limit: -1,
    filter: { status: { _eq: 'published' } },
    fields: ['*.*', 'authors.team_id.*', 'image.*', 'Tags'], // make sure to fetch the Tags field
    sort: ['-date'],
  }))

  // Resolve image URLs for each post
  const resolvedPosts = await Promise.all(posts.map(async (post) => ({
    ...post,
    resolvedImageUrl: await getAssetUrl(post.image, 300)
  })))

  return resolvedPosts
})

blogData.value = fetchedBlogData.value || []
blogDataSearch.value = blogData.value

// FETCH MODAL DATA AT BUILD TIME
const { data: fetchedModalData } = await useAsyncData('modalData', async () => {
  return await directus.request(readItems('reboot_democracy_modal', { fields: ['*.*'] }))
})

modalData.value = fetchedModalData.value || {}
showmodal.value = modalData.value.status === 'published'

// SET META TAGS
useHead({
  title: 'RebootDemocracy.AI',
  meta: [
    { name: 'description', content: 'Exploring AI, democracy, and governance.' },
    { property: 'og:title', content: 'RebootDemocracy.AI' },
    { property: 'og:description', content: 'Exploring AI, democracy, and governance.' },
    { property: 'twitter:title', content: 'RebootDemocracy.AI' },
    { property: 'twitter:description', content: 'Exploring AI, democracy, and governance.' },
  ],
})

// FORMAT DATE HELPER
function formatDateOnly(d: Date) {
  return format(d, 'MMMM d, yyyy')
}

// HELPER TO CHECK IF A PARTIAL STRING EXISTS IN ANY ARRAY ENTRY
function includesString(array: string[] | null, stringVal: string) {
  if (!array) return false
  return array.some(s => s.toLowerCase().includes(stringVal.toLowerCase()))
}

// SEARCH LOGIC
async function searchBlog() {
  searchloader.value = true
  searchTermDisplay.value = searchTerm.value
  searchResultsFlag.value = searchTerm.value ? 1 : 0
  blogDataSearch.value = blogData.value.filter(post =>
    post.title.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
  searchloader.value = false
}

// Create a debounced version of the search (500ms)
const debounceSearch = _.debounce(searchBlog, 500)

// Handle an enter-key or click event from the search input
function handleSearch() {
  debounceSearch()
}

function resetSearch() {
  debounceSearch()
}

function clearSearch() {
  searchTerm.value = ''
  resetSearch()
}

function closeModal() {
  showmodal.value = false
  if (typeof window !== 'undefined') localStorage.setItem('Reboot Democracy', 'off')
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const storedModal = localStorage.getItem('Reboot Democracy')
    showmodal.value = modalData.value.status === 'published' && storedModal !== 'off'
  }

  // Populate tag array from each post’s Tags field
  blogData.value.forEach(post => {
    post.Tags?.forEach(tag => {
      if (tag && !filteredTagData.value.includes(tag)) {
        filteredTagData.value.push(tag)
      }
    })
  })
})
</script>

<template>
  <!-- Header Component -->
  <LazyHydrate when-visible>
  <HeaderComponent></HeaderComponent>
</LazyHydrate>
  <!-- Modal Component -->
  <LazyHydrate when-visible>
  <vue-final-modal v-if="showmodal" @before-close="closeModal" v-model="showmodal" classes="modal-container" content-class="modal-comp">
    <ModalComp :modalData="modalData" @close="closeModal" />
  </vue-final-modal>
</LazyHydrate>
  <!-- Blog Page Hero -->
  <div class="blog-page-hero">
    <h1><span>Reboot Democracy</span> Blog</h1>
    <p>The Reboot Democracy Blog explores the complex relationship among AI, democracy and governance.</p>
    <LazyHydrate when-visible>
    <div class="search-bar-section">
      <input class="search-bar" ref="searchInputRef" v-model="searchTerm" @keyup.enter="handleSearch" type="text" role="search" aria-label="Search" placeholder="Search" />
      <span @click="clearSearch()" class="search-bar-cancel-btn material-symbols-outlined">cancel</span>
      <span @click="resetSearch()" class="search-bar-btn material-symbols-outlined">search</span>
    </div>
  </LazyHydrate>
    <div v-if="searchloader" class="loader-blog"></div>
  </div>

  <!-- Featured Blog Section -->
  <div class="blog-featured" v-if="!searchResultsFlag && searchTermDisplay == ''">
    <div class="blog-featured-row">
      <div class="first-blog-post" v-if="latestBlogPost">
        <a :href="'/blog/' + latestBlogPost.slug">
          <img v-if="latestBlogPost.resolvedImageUrl" class="blog-list-img" :src="latestBlogPost.resolvedImageUrl">
          <h3>{{ latestBlogPost.title }}</h3>
          <p>{{ latestBlogPost.excerpt }}</p>
          <p>Published on {{ formatDateOnly(new Date(latestBlogPost.date)) }}</p>
          <div class="author-list">
            <p class="author-name" v-if="latestBlogPost.authors.length">By</p>
            <div v-for="(author, i) in latestBlogPost.authors" :key="i" class="author-item">
              <div class="author-details">
                <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                <p class="author-name" v-if="latestBlogPost.authors.length > 1 && i < latestBlogPost.authors.length - 1">
                  and
                </p>
              </div>
            </div>
          </div>
        </a>
      </div>
      <div class="other-blog-posts">
        <div class="other-post-row" v-for="(blog_item, index) in blogData.slice(1, 4)" :key="blog_item.slug">
          <a :href="'/blog/' + blog_item.slug">
            <img v-if="blog_item.resolvedImageUrl" class="blog-list-img" :src="blog_item.resolvedImageUrl">
            <div class="other-post-details">
              <h3>{{ blog_item.title }}</h3>
              <p>{{ blog_item.excerpt }}</p>
              <p>Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
              <div class="author-list">
                <p class="author-name" v-if="blog_item.authors.length">By</p>
                <div v-for="(author, i) in blog_item.authors" :key="i" class="author-item">
                  <div class="author-details">
                    <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                    <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">
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

  <div class="read-more-post" v-if="!searchResultsFlag && searchTermDisplay == ''">
    <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
  </div>

  <!-- Latest Posts Section -->
  <div class="blog-section-header" v-if="!searchResultsFlag && searchTermDisplay == ''">
    <h2>Latest Posts</h2>
  </div>
  <div v-if="!searchResultsFlag && searchTermDisplay == ''" class="allposts-section">
    <div class="allposts-post-row" v-for="(blog_item, index) in blogData.slice(4, 16)" :key="blog_item.slug">
      <a :href="'/blog/' + blog_item.slug">
        <img v-if="blog_item.resolvedImageUrl" class="blog-list-img" :src="blog_item.resolvedImageUrl">
        <div class="allposts-post-details">
          <h3>{{ blog_item.title }}</h3>
          <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
          <div class="author-list">
            <p class="author-name" v-if="blog_item.authors.length">By</p>
            <div v-for="(author, i) in blog_item.authors" :key="i" class="author-item">
              <div class="author-details">
                <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">
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

  <!-- Filtered Posts Section -->
  <div v-if="!searchResultsFlag && searchTermDisplay == ''">
    <div class="allposts-section">
      <div v-for="tag_item in filteredTagDataWithoutNews" :key="tag_item" class="all-posts-row">
        <div class="blog-section-header">
          <h2>{{ tag_item }}</h2>
        </div>
        <div class="tag-posts-row-container">
          <div v-for="blog_item in blogDataSearch" :key="blog_item.slug" class="tag-posts-row">
            <div v-if="includesString(blog_item.Tags, tag_item)">
              <a :href="'/blog/' + blog_item.slug">
                <img v-if="blog_item.resolvedImageUrl" class="blog-list-img" :src="blog_item.resolvedImageUrl">
                <div class="allposts-post-details">
                  <h3>{{ blog_item.title }}</h3>
                  <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
                  <div class="author-list">
                    <p class="author-name" v-if="blog_item.authors.length">By</p>
                    <div v-for="(author, i) in blog_item.authors" :key="i" class="author-item">
                      <div class="author-details">
                        <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                        <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">
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

  <!-- Search Results Section -->
  <div v-if="searchResultsFlag && searchTermDisplay !== ''" class="allposts-section">
    <h2 class="search-term">Searching for <i>{{ searchTermDisplay }}</i></h2>
    <div class="allposts-post-row" v-for="blog_item in blogDataSearch" :key="blog_item.slug">
      <a :href="'/blog/' + blog_item.slug">
        <img v-if="blog_item.resolvedImageUrl" class="blog-list-img" :src="blog_item.resolvedImageUrl">
        <div class="allposts-post-details">
          <h3>{{ blog_item.title }}</h3>
          <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
          <div class="author-list">
            <p class="author-name" v-if="blog_item.authors.length">By</p>
            <div v-for="(author, i) in blog_item.authors" :key="i" class="author-item">
              <div class="author-details">
                <p class="author-name">{{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}</p>
                <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">
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

  <!-- Footer Component -->
  <FooterComponent></FooterComponent>
</template>