<template>
    <div>
      <!-- Search Input Section -->
      <div class="search-bar-section">
        <input
          class="search-bar"
          type="text"
          v-model="searchTerm"
          @keyup.enter="resetSearch"
          @input="handleInput"
          placeholder="SEARCH"
        />
        <span @click="clearSearch" class="search-bar-cancel-btn material-symbols-outlined">
          cancel
        </span>
        <span @click="resetSearch" class="search-bar-btn material-symbols-outlined">
          search
        </span>
      </div>
      <!-- Loader -->
      <div v-if="searchloader" class="loader-blog"></div>
      <!-- Results List -->
      <div v-if="searchResultsFlag && searchTerm !== ''">
        <div class="allposts-section">
          <div
            class="allposts-post-row"
            v-for="(blog_item, index) in blogDataSearch"
            :key="blog_item.slug || index"
          >
            <a :href="'/blog/' + blog_item.slug">
              <div v-if="blog_item.image">
                <img
                  class="blog-list-img"
                  :src="getAssetUrl(blog_item.image, 300)"
                  loading="lazy"
                />
              </div>
              <div class="allposts-post-details">
                <h3>{{ blog_item.title }}</h3>
                <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
                <div class="author-list">
                  <p class="author-name" v-if="blog_item.authors.length > 0">By</p>
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
          <a href="/all-blog-posts" class="btn btn-small btn-primary">
            Read All Posts
          </a>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  import _ from 'lodash';
  import { createDirectus, rest, readItems } from '@directus/sdk';
  
  // Configure asset base URL and fallback image ID.
  const ASSET_BASE_URL = import.meta.env.DEV
    ? 'https://dev.thegovlab.com/assets/'
    : 'https://ssg-test.rebootdemocracy.ai/assets/';
  const FALLBACK_ID = '4650f4e2-6cc2-407b-ab01-b74be4838235';
  
  // Create a Directus client instance.
  const directus = createDirectus('https://dev.thegovlab.com').with(rest());
  
  // Reactive state properties for search functionality.
  const searchTerm = ref('');
  const searchResultsFlag = ref<number>(0);
  const searchloader = ref<boolean>(false);
  const blogDataSearch = ref<any[]>([]);
  const blogData = ref<any[]>([]); // This can be used to hold all posts if needed.
  
  // Helper function to build an asset URL from a Directus file object.
  function getAssetUrl(file: any, width: number = 800): string {
    if (!file) {
      return ASSET_BASE_URL + FALLBACK_ID + (width ? `?width=${width}` : '');
    }
    const fileName = file.filename_disk || file.id;
    return ASSET_BASE_URL + fileName + (width ? `?width=${width}` : '');
  }
  
  // A simple date-only formatter.
  function formatDateOnly(date: Date): string {
    // (Alternatively, you might use date-fns/format.)
    return new Date(date).toLocaleDateString();
  }
  
  // --- Search Functions ---
  
  async function searchBlog() {
    searchloader.value = true;
    if (searchTerm.value.trim().length > 0) {
      searchResultsFlag.value = 1;
      const searchTermClean = searchTerm.value.trim();
      // Clear previous results.
      blogDataSearch.value = [];
      try {
        const [directusData, weaviateSlugs] = await Promise.all([
          performDirectusSearch(searchTermClean),
          performWeaviateSearch(searchTermClean)
        ]);
        await processSearchResults(directusData, weaviateSlugs);
      } catch (error) {
        console.error('Error during hybrid search:', error);
        blogDataSearch.value = [];
      } finally {
        searchloader.value = false;
      }
    } else {
      searchResultsFlag.value = 0;
      // Optionally reset to full blog list.
      blogDataSearch.value = blogData.value;
      searchloader.value = false;
    }
  }
  
  async function performDirectusSearch(searchTermClean: string): Promise<any[]> {
    try {
      const result = await directus.request(
        readItems('reboot_democracy_blog', {
          limit: -1,
          filter: {
            _and: [
              { date: { _lte: '$NOW(-5 hours)' } },
              { status: { _eq: 'published' } },
              {
                _or: [
                  { title: { _contains: searchTermClean } },
                  { excerpt: { _contains: searchTermClean } },
                  { content: { _contains: searchTermClean } },
                  { authors: { team_id: { First_Name: { _contains: searchTermClean } } } },
                  { authors: { team_id: { Last_Name: { _contains: searchTermClean } } } },
                  { authors: { team_id: { Title: { _contains: searchTermClean } } } }
                ]
              }
            ]
          },
          sort: ['date'],
          fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*']
        })
      );
      return result && result.data ? result.data : result;
    } catch (error) {
      throw error;
    }
  }
  
  async function performWeaviateSearch(searchTermClean: string): Promise<string[]> {
    try {
      const response = await fetch('/.netlify/functions/search_weaviate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTermClean })
      });
      if (!response.ok) throw new Error('Weaviate search failed');
      const weaviateData = await response.json();
      return weaviateData.slugs || [];
    } catch (error) {
      throw error;
    }
  }
  
  async function processSearchResults(directusData: any[], weaviateSlugs: string[]): Promise<void> {
    const directusSlugMap = new Map(directusData.map((post: any) => [post.slug, post]));
    const weaviateSlugsNotInDirectus = weaviateSlugs.filter(
      (slug: string) => !directusSlugMap.has(slug)
    );
  
    let weaviateOnlyPosts: any[] = [];
    if (weaviateSlugsNotInDirectus.length > 0) {
      try {
        const res = await directus.request(
          readItems('reboot_democracy_blog', {
            limit: -1,
            filter: {
              _and: [
                { date: { _lte: '$NOW(-5 hours)' } },
                { status: { _eq: 'published' } },
                { _or: weaviateSlugsNotInDirectus.map((slug) => ({ slug: { _eq: slug } })) }
              ]
            },
            fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*']
          })
        );
        weaviateOnlyPosts = res && res.data ? res.data : res;
      } catch (error) {
        console.error('Error fetching weaviate-only posts:', error);
      }
    }
  
    const overlappingSlugsSet = new Set(
      weaviateSlugs.filter((slug: string) => directusSlugMap.has(slug))
    );
    const overlappingPosts = weaviateSlugs
      .filter((slug: string) => overlappingSlugsSet.has(slug))
      .map((slug: string) => directusSlugMap.get(slug));
  
    const directusOnlyPosts = directusData.filter(
      (post: any) => !overlappingSlugsSet.has(post.slug)
    );
  
    const weaviateOnlySlugMap = new Map(weaviateOnlyPosts.map((post: any) => [post.slug, post]));
    const weaviateOnlyOrdered = weaviateSlugsNotInDirectus
      .map((slug: string) => weaviateOnlySlugMap.get(slug))
      .filter(Boolean);
  
    const mergedPosts = [
      ...directusOnlyPosts,
      ...overlappingPosts,
      ...weaviateOnlyOrdered
    ];
  
    const searchTermClean = searchTerm.value.trim().toLowerCase();
    const boostedResults = mergedPosts.map((post: any) => {
      let boost = 0;
      if (post.content && post.content.toLowerCase().includes(searchTermClean)) {
        boost += 100;
      }
      return { post, boost };
    });
  
    boostedResults.sort((a, b) => {
      const aIsBoosted = a.boost > 0;
      const bIsBoosted = b.boost > 0;
      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;
      if (aIsBoosted && bIsBoosted) return b.boost - a.boost;
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    });
    blogDataSearch.value = boostedResults.map(x => x.post);
  }
  
  // --- Debounce ---
  const debouncedSearch = _.debounce(searchBlog, 500);
  
  // --- Event Handlers ---
  function handleInput() {
    debouncedSearch();
  }
  
  function resetSearch() {
    blogDataSearch.value = [];
    searchResultsFlag.value = 0;
    searchBlog();
  }
  
  function clearSearch() {
    searchTerm.value = '';
    resetSearch();
  }
  </script>
  
  <style scoped>
  /* Add component-specific styles here */
  .search-bar-section {
    display: flex;
    align-items: center;
  }
  .search-bar {
    flex: 1;
    padding: 0.5rem;
    /* ...other styles */
  }
  .search-bar-btn,
  .search-bar-cancel-btn {
    cursor: pointer;
    margin-left: 0.5rem;
    /* ...other styles */
  }
  .loader-blog {
    margin-top: 1rem;
  }
  /* Customize the search results list as needed */
  </style>