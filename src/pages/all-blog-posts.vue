<script>
import { ref, watch } from 'vue';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
import _ from "lodash";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal'
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import { register } from 'swiper/element/bundle';
import { useHead } from '@vueuse/head';

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
  },
  data() {
    return {
      searchResultsFlag: 0,
      searchResults: [],
      searchTerm: "",
      searchTermDisplay: "",
      debounceSearch: '',
      searchloader: false,
      loadAPI: false,
      animateNext: 0,
      currentDate: '',
      prevItem: 0,
      currentItem: 1,
      nextItem: 2,
      testimonialsLength: 0,
      blogData: [],
      blogDataSearch: [],
      modalData: [],
      workshopData: [],
      playpause: true,
      showmodal: false,
      directus: new Directus('https://content.thegovlab.com/'),
      path: this?.$route?.fullPath ?? '',
      slideautoplay: 1,
      slidetransition: 7000,
      slider: '',
      wsloaded: false,
      ini: true,

      // Replicating from blog-page:
      pschatContent: '',
      pschatLoading: false,
    }
  },
  watch: {
    '$route': {
      handler: function () {
        this.loadModal();
      },
      deep: true,
      immediate: true
    },
  },
  created() {
    this.loadModal();
    // Kick off initial data fetch
    this.fetchBlog();
    // Initially run search to populate the displayed results
    this.resetSearch();
  },
  mounted() {
    this.fillMeta();
    register();
  },
  methods: {
    // ------------------------------------------------
    // Replicated Search Logic from blog-page
    // ------------------------------------------------
    async searchBlog() {
      this.searchloader = true;

      // If there's a searchTerm, do Weaviate + Directus queue
      if (this.searchTerm.trim().length > 0) {
        this.searchResultsFlag = 1;
        const searchTermClean = this.searchTerm.trim();

        // Clear previous search results from data
        this.pschatContent = '';
        this.blogDataSearch = [];

        // Launch both searches in parallel:
        // (Feel free to un-comment and implement performPsChatSearch if you want the streaming content from Redwood)
        // const psChatPromise = this.performPsChatSearch(searchTermClean);
        const directusPromise = this.performDirectusSearch(searchTermClean);
        const weaviatePromise = this.performWeaviateSearch(searchTermClean);

        try {
          const [directusData, weaviateSlugs] = await Promise.all([
            directusPromise,
            weaviatePromise,
          ]);
          // Process the combined search results
          await this.processSearchResults(directusData, weaviateSlugs);
        } catch (error) {
          console.error('Error during searches:', error);
          this.blogDataSearch = [];
        } finally {
          this.searchloader = false;
        }
      } else {
        // If empty searchTerm, revert to showing all published blog posts
        this.searchResultsFlag = 0;
        this.blogDataSearch = this.blogData;
        this.searchloader = false;
      }
    },
    async performPsChatSearch(searchTermClean) {
      let pschatContent = '';
      this.pschatLoading = true; // Start loading
      try {
        const response = await fetch('/.netlify/functions/blog_content_search', {
          method: 'POST',
          body: JSON.stringify({ message: searchTermClean }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const temp = JSON.parse(chunk);

          // Update the content as it streams in
          pschatContent = temp.reply;
        }

        return pschatContent;
      } catch (error) {
        throw error;
      } finally {
        this.pschatLoading = false; // End loading
      }
    },
    async performDirectusSearch(searchTermClean) {
      try {
        const directusResult = await this.directus.items('reboot_democracy_blog').readByQuery({
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
                  {
                    authors: {
                      _some: {
                        team_id: {
                          First_Name: { _contains: searchTermClean },
                        },
                      },
                    },
                  },
                  {
                    authors: {
                      _some: {
                        team_id: {
                          Last_Name: { _contains: searchTermClean },
                        },
                      },
                    },
                  },
                  {
                    authors: {
                      _some: {
                        team_id: {
                          Title: { _contains: searchTermClean },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
          sort: ['date'],
          fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*'],
        });
        return directusResult.data || [];
      } catch (error) {
        throw error;
      }
    },
    async performWeaviateSearch(searchTermClean) {
      try {
        const weaviateResponse = await fetch('/.netlify/functions/search_weaviate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchTermClean }),
        });
        if (!weaviateResponse.ok) throw new Error('Weaviate search failed');
        const weaviateData = await weaviateResponse.json();
        return weaviateData.slugs || [];
      } catch (error) {
        throw error;
      }
    },
    async processSearchResults(directusData, weaviateSlugs) {
      const directusSlugMap = new Map(directusData.map((post) => [post.slug, post]));
      let overlappingPosts = [];
      let directusOnlyPosts = [];

      // Identify slugs from Weaviate that are not in the Directus results
      const weaviateSlugsNotInDirectus = weaviateSlugs.filter((slug) => !directusSlugMap.has(slug));
      let weaviateOnlyPosts = [];

      if (weaviateSlugsNotInDirectus.length > 0) {
        const slugFilters = weaviateSlugsNotInDirectus.map(slug => ({ slug: { _eq: slug } }));
        const weaviateOnlyResult = await this.directus.items('reboot_democracy_blog').readByQuery({
          limit: -1,
          filter: {
            _and: [
              { date: { _lte: '$NOW(-5 hours)' } },
              { status: { _eq: 'published' } }
            ],
            _or: slugFilters
          },
          fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*'],
        });
        weaviateOnlyPosts = weaviateOnlyResult.data || [];
      }

      // Overlapping: those in directus + in weaviate
      const overlappingSlugsSet = new Set(
        weaviateSlugs.filter((slug) => directusSlugMap.has(slug))
      );

      // Overlapping posts come from directusSlugMap but are ordered according to slugs in Weaviate
      overlappingPosts = weaviateSlugs
        .filter(slug => overlappingSlugsSet.has(slug))
        .map(slug => directusSlugMap.get(slug));

      // Directus-only posts: those that are not overlapping
      directusOnlyPosts = directusData.filter(post => !overlappingSlugsSet.has(post.slug));

      // Weaviate-only posts: also keep the order of the weaviate results
      const weaviateOnlySlugMap = new Map(weaviateOnlyPosts.map(post => [post.slug, post]));
      const weaviateOnlyOrdered = weaviateSlugsNotInDirectus
        .map(slug => weaviateOnlySlugMap.get(slug))
        .filter(Boolean);

      // Final combined ordering
      this.blogDataSearch = [...directusOnlyPosts, ...overlappingPosts, ...weaviateOnlyOrdered];
    },
    resetSearch() {
      this.blogDataSearch = [];
      this.searchactive = false;
      this.searchResultsFlag = 0;
      this.searchTermDisplay = this.searchTerm;
      this.pschatContent = '';
      this.searchBlog();
    },
    // ------------------------------------------------
    // End of Replicated Search Logic
    // ------------------------------------------------

    fillMeta() {
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
      })
    },
    loadModal() {
      const self = this;
      this.directus
        .items('innovate_us_modal')
        .readByQuery({
          meta: 'total_count',
          limit: -1,
          fields: ['*.*']
        })
        .then((item) => {
          self.modalData = item.data;
          // showmodal is controlled by checking localStorage & published status - as existing code
          self.showmodal =
            localStorage.getItem(self.modalData?.campaigns?.campaign_name) !== "off" &&
            self.modalData.status === 'published'
              ? true
              : false;
        });
    },
    closeModal() {
      this.showmodal = false;
      localStorage.setItem(this.modalData?.campaigns?.campaign_name, "off");
      // edgecase if modal opens and the workshop banner is not in
      if (this.$refs.banner && this.$refs.banner.slider) {
        this.$refs.banner.slider.scrollLeft === 0
          ? this.$refs.banner.sliderPos()
          : '';
      }
    },
    nextTestimonial() {
      if (this.nextItem <= this.testimonialsLength - 1) {
        this.prevItem++;
        this.currentItem++;
        this.nextItem++;
        this.animateNext = !this.animateNext;
      } else {
        this.prevItem = this.testimonialsLength - 2;
        this.currentItem = this.testimonialsLength - 1;
        this.nextItem = this.testimonialsLength;
      }
    },
    prevTestimonial() {
      if (this.prevItem > -1) {
        this.prevItem--;
        this.currentItem--;
        this.nextItem--;
      } else {
        this.prevItem = -1;
        this.currentItem = 0;
        this.nextItem = 1;
      }
    },
    formatDateTime(d1) {
      return format(d1, 'MMMM d, yyyy, h:mm aa');
    },
    formatDateOnly(d1) {
      return format(d1, 'MMMM d, yyyy');
    },
    PastDate(d1) {
      return isPast(d1);
    },
    FutureDate(d1) {
      return isFuture(new Date(d1));
    },
    fetchBlog() {
      const self = this;
      this.directus
        .items('reboot_democracy_blog')
        .readByQuery({
          meta: 'total_count',
          limit: 50,
          filter: {
            status: {
              _eq: "published",
            },
          },
          fields: [
            '*.*',
            'authors.team_id.*',
            'authors.team_id.Headshot.*'
          ],
          sort: ["date"]
        })
        .then((item) => {
          self.blogData = item.data;
          // If no search term, show all posts after fetch
          if (!self.searchTerm.trim()) {
            self.blogDataSearch = self.blogData;
          }
        });
    }
  }
}
</script>

<template>
    <!-- Header Component -->
    <header-comp></header-comp>
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
        @click="
          searchTerm = '';
          resetSearch();
        "
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
    <h2 v-if="searchResultsFlag && searchTerm !== ''">
      Searching for <i>{{ searchTermDisplay }}</i>
    </h2>
  </div>

  <div class="allposts-section">
    <div
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
            <p class="author-name"
              >{{ blog_item.authors.length > 0 ? 'By' : '' }}</p
            >
            <div v-for="(author, i) in blog_item.authors" :key="i">
              <div class="author-item">
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
        </div>
        <img
          v-if="blog_item.image"
          class="blog-list-img"
          :src="directus._url + 'assets/' + blog_item.image.id"
          alt="blog-item-img"
        />
      </a>
    </div>
  </div>

  <!-- Footer Component -->
  <footer-comp></footer-comp>
</template>