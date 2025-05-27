<script>
import { ref, watch } from 'vue';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
import isToday from 'date-fns/isToday';
import _ from "lodash";
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import ModalComp from "../components/modal.vue";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal'
import { lazyLoad } from '../directives/lazyLoad';
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import { register } from 'swiper/element/bundle';
import {useHead } from '@vueuse/head'
import OpenAIChat from "../components/pschat.vue";

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "openai-chat":OpenAIChat,
    "ws-banner":
        VueFinalModal,
    ModalsContainer,
    ModalComp,
  
  },
    directives: {
    lazyLoad
  },
  data() {
    return {
     searchResultsFlag: 0,
      searchResults: [],
      searchTerm: "",
      searchTermDisplay:"",
      debounceSearch:'',
      searchloader:false,
      loadAPI: false,
      animateNext: 0,
      currentDate: '',
      prevItem: 0,
      currentItem: 1,
      nextItem: 2,
      testimonialsLength:0,                               
      blogData: [],
      blogDataSearch: [],
      filteredTagData: [],
      modalData: [],
      workshopData: [],
      playpause:true,
      showmodal: false,
      weeklyNewsitem: [],
      directus: new Directus('https://directus.theburnescenter.org/'),
      path:this.$route.fullPath,
      slideautoplay:1,
      slidetransition:7000,
      slider:'',
      wsloaded:false,
      ini:true,
      pschatContent: '',
      pschatLoading: false,

    }
  },
  watch :{
  '$route': {
    handler: function(r) {

       this.loadModal(); 
    },
    deep: true,
      immediate: true
  },
  },
  computed: {
  latestBlogPost() {
    if (Array.isArray(this.blogData) && this.blogData.length > 0) {
      // Use spread operator to create a copy, then reverse
      return [...this.blogData].reverse()[0];
      // Or simply return the last item if data is sorted chronologically
      // return this.blogData[this.blogData.length - 1];
    }
    return null;
  },
  dedupedSearchResults() {
    const seenSlugs = new Set();
    const seenDirectusIds = new Set();
    return this.searchResults.filter(item => {
      if (item._type === 'blogPost') {
        if (item.slug && !seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          return true;
        }
        return false;
      } else if (item._type === 'weeklyNews') {
        if (item.directusId && !seenDirectusIds.has(item.directusId)) {
          seenDirectusIds.add(item.directusId);
          return true;
        }
        return false;
      }
      return true;
    });
  },
  filteredTagDataWithoutNews() {
    return this.filteredTagData.filter(tag => tag !== "News that caught our eye");
  }
},
  created() {
  
    this.loadModal(); 
    // this.blogData = this.directus.items("reboot_democracy_blog");
   
   
    // this.debounceSearch = _.debounce(this.searchBlog, 500);
    
  },
mounted() {
  this.fetchCombinedData();
  this.fillMeta();
  register();
},
  
  methods: {
    
    fetchCombinedData() {
  self = this;
  const nowOffset = self.getDirectusNowOffset(); // "$NOW(-4 hours)" or "$NOW(-5 hours)"

  Promise.all([
    this.directus.items('reboot_democracy_blog').readByQuery({
      meta: 'total_count',
      limit: -1,
      filter: {
        _and: [
          // {  _lte: nowOffset } },
          { status: { _eq: 'published' } }
        ]
      },
      fields: [
        '*.*',
        'authors.team_id.*',
        'authors.team_id.Headshot.*'
      ],
      sort: ["date2"]
    }),
    this.directus.items('reboot_democracy_weekly_news').readByQuery({
      meta: 'total_count',
      limit: -1,
        filter: {
        _and: [
          { date: { _lte: nowOffset } },
        ]
      },
      fields: [
        '*.*'
      ],
      sort: ["date"]
    })
  ])
  .then(([blogResult, weeklyNewsResult]) => {
    const blogData = blogResult.data || [];
    console.log("blogData",blogData);
    const weeklyNewsData = weeklyNewsResult.data || [];

    // Combine both arrays and sort chronologically by date (descending)
    const combinedData = [...blogData, ...weeklyNewsData].sort((a, b) => 
      new Date(a.date2) - new Date(b.date2)
    );

    self.blogData = combinedData;
  })
  .catch((error) => {
    console.error('Error fetching combined data:', error);
    self.blogData = [];
  });
},

     renderMarkdown (text) {
        const rawHtml = marked(text);
        return DOMPurify.sanitize(rawHtml);
      },
      handleSearch() {
         // Run your existing resetSearch or blog search logic
         this.resetSearch();  
         
         // Force the keyboard to close by removing focus from the input
         if (this.$refs.searchInputRef) {
           this.$refs.searchInputRef.blur();
         }

         // (Optional) If search results appear off-screen, scroll them into view
         // 
         // this.$nextTick(() => {
         //   const resultsContainer = document.getElementById('search-results');
         //   if (resultsContainer) {
         //     resultsContainer.scrollIntoView({ behavior: 'smooth' });
         //   }
         // });
       },
       async searchBlog() {
    this.searchloader = true;
    if (this.searchTerm.trim().length > 0) {
      try {
        const response = await fetch('/.netlify/functions/search_weaviate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: this.searchTerm.trim() }),
        });
        if (!response.ok) throw new Error('Weaviate search failed');
        const { results } = await response.json();
        this.searchResults = results;
      } catch (error) {
        console.error('Error during Weaviate search:', error);
        this.searchResults = [];
      } finally {
        this.searchloader = false;
      }
    } else {
      this.searchResults = [];
      this.searchloader = false;
    }
  },

    // New helper method to handle PSChat search
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
        console.log(chunk);
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

    // New helper method to handle Directus search
    async performDirectusSearch(searchTermClean) {
      try {
        const directusResult = await this.directus.items('reboot_democracy_blog').readByQuery({
          limit: -1,
          filter: {
            _and: [
              { date2: { _lte: '$NOW(-5 hours)' } },
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

    // New helper method to handle Weaviate search
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

    // New helper method to process search results
    async processSearchResults(directusData, weaviateSlugs) {
      const self = this;
      const directusSlugMap = new Map(directusData.map((post) => [post.slug, post]));
      let overlappingPosts = [];
      let directusOnlyPosts = [];

      // Fetch posts from Directus for slugs in Weaviate that were not in Directus results
      const weaviateSlugsNotInDirectus = weaviateSlugs.filter((slug) => !directusSlugMap.has(slug));
      let weaviateOnlyPosts = [];

      if (weaviateSlugsNotInDirectus.length > 0) {
        const slugFilters = weaviateSlugsNotInDirectus.map((slug) => ({ slug: { _eq: slug } }));
        const weaviateOnlyResult = await self.directus.items('reboot_democracy_blog').readByQuery({
          limit: -1,
          filter: {
            _and: [{ date2: { _lte: '$NOW(-5 hours)' } }, { status: { _eq: 'published' } }],
            _or: slugFilters,
          },
          fields: ['*.*', 'authors.team_id.*', 'authors.team_id.Headshot.*'],
        });
        weaviateOnlyPosts = weaviateOnlyResult.data || [];
      }

      // Separate overlapping posts and Directus-only posts
      const overlappingSlugsSet = new Set(
        weaviateSlugs.filter((slug) => directusSlugMap.has(slug))
      );

      // Overlapping posts: get from directusSlugMap, order according to Weaviate results
      overlappingPosts = weaviateSlugs
        .filter((slug) => overlappingSlugsSet.has(slug))
        .map((slug) => directusSlugMap.get(slug));

      // Directus-only posts: posts in directusData not in overlappingSlugsSet
      directusOnlyPosts = directusData.filter((post) => !overlappingSlugsSet.has(post.slug));

      // Weaviate-only posts: order according to Weaviate results
      const weaviateOnlySlugMap = new Map(weaviateOnlyPosts.map((post) => [post.slug, post]));
      const weaviateOnlyOrdered = weaviateSlugsNotInDirectus
        .map((slug) => weaviateOnlySlugMap.get(slug))
        .filter(Boolean);

      // Construct blogDataSearch
      // Directus search results first, overlapping posts ordered by Weaviate
      self.blogDataSearch = [...directusOnlyPosts, ...overlappingPosts, ...weaviateOnlyOrdered];
    },
    includesString(array, string) {
    if (!array) return false;
    const lowerCasePartialSentence = string.toLowerCase();
    return array.some(s => s.toLowerCase().includes(lowerCasePartialSentence));
    },
    resetSearch() {
      (this.blogDataSearch = []);
      this.searchactive = false;
      this.searchResultsFlag = 0;
      this.searchTermDisplay = this.searchTerm;
      this.pschatContent = '';
      this.searchBlog();
    },
    fillMeta()
    {
     useHead({
      title: "RebootDemocracy.AI",
      meta: [
        { name: 'title', content:"RebootDemocracy.AI" },
        { property: 'og:title', content: "RebootDemocracy.AI" },
        { property: 'og:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`},
        { property: 'og:image', content: "https://directus.theburnescenter.org/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},
        { property: 'twitter:title', content: "RebootDemocracy.AI"},
        { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`},
        { property: 'twitter:image', content: "https://directus.theburnescenter.org/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},
        { property: 'twitter:card', content: "summary_large_image" },
      ],
    })
    },


    nextTestimonial(){
      if (this.nextItem <= this.testimonialsLength-1){
        this.prevItem++;
        this.currentItem++;
        this.nextItem++;
       this.animateNext = !this.animateNext;
      }
      else{
        this.prevItem = this.testimonialsLength-2;
        this.currentItem = this.testimonialsLength-1;
        this.nextItem = this.testimonialsLength;
      }
      console.log( this.prevItem, this.currentItem,this.nextItem);
    },
    prevTestimonial(){

      if (this.prevItem > -1){
        this.prevItem--;
        this.currentItem--;
        this.nextItem--;
      }
      else{
        this.prevItem = -1;
        this.currentItem = 0;
        this.nextItem = 1;
      }

    },
      formatDateTime: function formatDateTime(d1) {
        return format(d1, 'MMMM d, yyyy, h:mm aa');
      },
      formatDateOnly: function formatDateOnly(d1) {
        return format(d1, 'MMMM d, yyyy');
      },
      PastDate: function PastDate(d1) {
        return isPast(d1);
      },
      FutureDate: function FutureDate(d1) {
        return isFuture(new Date(d1));
      },
      CurrentDate: function CurrentDate(d1) {
        return isToday(new Date(d1));
      },
      inclucesInArray:function (haystack,ele){
      return haystack.some(subArray =>
        Array.isArray(subArray) &&
        ele.length === subArray.length &&
        ele.every((element, index) => element === subArray[index])
      );
      },
      inclucesString:function (array,string){
        const lowerCasePartialSentence = string.toLowerCase();
      return array?.some(s => s.toLowerCase().includes(lowerCasePartialSentence));
      },
        loadModal() {
     self = this;
      this.directus
      .items('reboot_democracy_modal')
      .readByQuery({     
          meta: 'total_count',
         limit: -1,
         fields: [
          '*.*']
      }).then((item) => {
      self.modalData = item.data;
      
      console.log(self.modalData);

     let storageItem = localStorage.getItem("Reboot Democracy");
     self.showmodal = self.modalData.status == 'published' && (self.modalData.visibility == 'always' || (self.modalData.visibility == 'once' && storageItem != 'off'));

        })
    },
    closeModal() {
     this.showmodal=false;
     localStorage.setItem("Reboot Democracy","off");
    
    },
    isEasternDST(date) {
  const year = date.getFullYear();

  // Calculate DST start: Second Sunday in March at 2:00 AM ET
  const march = new Date(year, 2, 1); // March 1st
  const firstSundayMarch = 7 - march.getDay();
  const secondSundayMarch = firstSundayMarch + 7;
  const dstStart = new Date(year, 2, secondSundayMarch, 2); // 2:00 AM

  // Calculate DST end: First Sunday in November at 2:00 AM ET
  const november = new Date(year, 10, 1); // November 1st
  const firstSundayNovember = november.getDay() === 0 ? 1 : (1 + (7 - november.getDay()));
  const dstEnd = new Date(year, 10, firstSundayNovember, 2); // 2:00 AM

  return date >= dstStart && date < dstEnd;
}, 
    getDirectusNowOffset() {
  const now = new Date();
  return this.isEasternDST(now) ? '$NOW(-4 hours)' : '$NOW(-5 hours)';
},

    fetchBlog() {
      self = this;
      const nowOffset = self.getDirectusNowOffset(); // "$NOW(-4 hours)" or "$NOW(-5 hours)"

      this.directus
        .items('reboot_democracy_blog')
        .readByQuery({
          meta: 'total_count',
          limit: -1,
          filter: {
            _and: [
            // { date2: { _lte: nowOffset } },
              { status: { _eq: 'published' } }
            ]
          },
          fields: [
            '*.*',
            'authors.team_id.*',
            'authors.team_id.Headshot.*'
          ],
          sort: ["date2"]
        })
      .then((item) => {
      self.blogData =  item.data;
      
      item.data.map((tag)=>{
        tag?.Tags?.map(subTags =>{
          if(subTags != null && !this.inclucesString(this.filteredTagData,subTags)){
            this.filteredTagData.push(subTags);
          }
        })
        // if(tag?.Tags !=null && !this.inclucesInArray(this.filteredTagData,tag.Tags)){
        //   this.filteredTagData.push(tag.Tags);
        // }
      })
      this.filteredTagData.unshift(this.filteredTagData.splice(this.filteredTagData.indexOf("News that caught our eye"), 1)[0]);

      this.resetSearch();
      // self.testimonialsLength = self.blogData.testimonials.length;
      });
    },

      fetchNews: function fetchNews() {
      self = this;

      this.directus
      .items('reboot_democracy__news')
      .readByQuery({
         meta: 'total_count',
         limit: 1,
         fields: [
          '*.*'
       ],
       sort: '-id',
       
      })
      .then((item) => {
      self.Newsitem =  item.data[0];
      });
    },


  }
}
</script>
<style>
.pschat-result-container {
  max-height: 200px; /* Adjust the max height as needed */
  min-height: 150px;
  overflow-y: auto;
  margin: 20px 0; /* Optional: add margin for spacing */
  padding: 15px; /* Optional: add padding inside the container */
  border: 1px solid #ccc; /* Optional: add a border */
  background-color: #fff;/* Optional: background color */
  color:#000;
}
.pschat-loader {
  /* Center the loader text or animation */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2em;
  color: #555;
}

/* You can add a spinner animation if you prefer */
.pschat-loader::after {
  content: '';
  margin-left: 10px;
  border: 4px solid #ccc;
  border-top: 4px solid #1d72b8;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spinner 0.6s linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}
</style>
<template>

    <!-- Header Component -->
    <header-comp></header-comp>
    
          <vue-final-modal  v-if="showmodal" @before-close="closeModal" v-model="showmodal" classes="modal-container" content-class="modal-comp">
<ModalComp :modalData="modalData" @close="closeModal" />    </vue-final-modal>
<div class="blog-page-hero">
    <h1>Rebooting Democracy in the Age of AI</h1>
    <p>Insights on Tech and Governance from Beth Simone Noveck</p>   
    <div class="search-bar-section"> 
      <input class="search-bar" ref="searchInputRef" v-model="searchTerm" @keyup.enter="handleSearch" type="text" role="search" aria-label="Search" placeholder="Search" />
      <span @click="searchTerm = ''; resetSearch();" class="search-bar-cancel-btn material-symbols-outlined">cancel</span>
      <span @click="resetSearch()" class="search-bar-btn material-symbols-outlined">search</span>
    </div>
    <div v-if="searchloader" class="loader-blog"></div>
  </div>


<!-- Featured Blog Section -->

<div class="blog-featured" v-if="blogData.length > 0 && !searchResultsFlag && searchTermDisplay == ''"> 
  <div class="blog-featured-row">

    <div class="first-blog-post">

<a :href="(blogData.length > 0 && blogData.slice().reverse()[0].slug) ? ('/blog/' + blogData.slice().reverse()[0].slug) : (blogData.length > 0 && blogData.slice().reverse()[0].edition ? '/newsthatcaughtoureye/' + blogData.slice().reverse()[0].edition : '#')">


        <div v-lazy-load>
        <img  v-if="blogData.slice().reverse()[0].image" class="blog-list-img" :data-src= "this.directus._url+'assets/'+ blogData.slice().reverse()[0].image.id+'?width=800'">
         <img v-if="!blogData.slice().reverse()[0].image" class="blog-list-img" :data-src="'/newsheader.jpg'">
        </div>
        <h3>{{blogData.slice().reverse()[0].title}}</h3>
        <p v-if="blogData.slice().reverse()[0].excerpt ">{{ blogData.slice().reverse()[0].excerpt }}</p>
        <p v-if="blogData.slice().reverse()[0].summary ">{{ blogData.slice().reverse()[0].summary }}</p>
        <p>Published on {{ formatDateOnly(new Date( blogData.slice().reverse()[0].date2)) }} </p>
                <div v-if="!blogData.slice().reverse()[0].authors" class="author-list">
                  <p class="author-name">{{blogData.slice().reverse()[0].author}}</p>
                </div>
        <div v-if="blogData.slice().reverse()[0].authors"  class="author-list">
            <p class="author-name">{{blogData.slice().reverse()[0].authors.length>0?'By':''}}</p>
              <div v-for="(author,i) in blogData.slice().reverse()[0].authors">
                <div class="author-item">               
                  <div class="author-details">
                    <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                    <p class="author-name" v-if="blogData.slice().reverse()[0].authors.length > 1 && i < blogData.slice().reverse()[0].authors.length - 1">and</p>
                  </div>
                </div>
              </div>
              
          </div>
        </a>  
        
    </div>

    <div class="other-blog-posts" v-if="!searchResultsFlag  || searchTerm == ''">
      <div class="other-post-row" v-for="(blog_item,index) in blogData.slice().reverse()"  v-show = "index > 0 && index < 4"> 
       <a  :href="blog_item.slug ? ('/blog/' + blog_item.slug) : '/newsthatcaughtoureye/' + blog_item.edition">
        <div v-lazy-load>
        <img v-if="blog_item.image" class="blog-list-img" :data-src= "this.directus._url+'assets/'+ blog_item.image.id">
        <img v-if="!blog_item.image" class="blog-list-img" :data-src="'/newsheader.jpg'">
        </div>
        <div class="other-post-details">
              <h3>{{blog_item.title}}</h3>
              <p v-if="blog_item.excerpt ">{{ blog_item.excerpt }}</p>
              <p v-if="blog_item.summary ">{{ blog_item.summary }}</p>
               <p>Published on {{ formatDateOnly(new Date( blog_item.date2)) }} </p>
                <div v-if="!blog_item.authors" class="author-list">
                  <p class="author-name">{{blog_item.author}}</p>
                </div>
              <div v-if="blog_item.authors"  class="author-list">
                   <p  class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
                    <div v-for="(author,i) in blog_item.authors">
                      <div class="author-item">
                        <div class="author-details">
                          <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                          <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
                        </div>
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

<div v-if="!searchResultsFlag && searchTermDisplay == ''"  class="allposts-section">
  <div class="allposts-post-row" v-for="(blog_item, index) in blogData.slice().reverse()" v-show="index < 15">
   <a :href="blog_item.slug ? ('/blog/' + blog_item.slug) : '/newsthatcaughtoureye/' + blog_item.edition">

      <div v-lazy-load>
        <img v-if="blog_item.image" class="blog-list-img" :data-src="this.directus._url+'assets/'+ blog_item.image.id">
        <img v-if="!blog_item.image" class="blog-list-img" :data-src="'/newsheader.jpg'">
      </div>
      <div class="allposts-post-details">
        <h3>{{blog_item.title}}</h3>
        <p class="post-date">Published on {{ formatDateOnly(new Date( blog_item.date2)) }}</p>
        <div v-if="!blog_item.authors" class="author-list">
          <p class="author-name">{{blog_item.author}}</p>
          </div>
        <div v-if="blog_item.authors" class="author-list">
          <p class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
          <div v-for="(author,i) in blog_item.authors">
            <div class="author-item">
              <div class="author-details">
                <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  </div>
  <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
</div>

<!-- Search section -->
<!-- <div v-if="searchResults.length > 0 && searchTerm" class="allposts-section"> -->
  <div v-if="dedupedSearchResults.length > 0 && searchTerm" class="allposts-section">
  <div class="allposts-post-row"  v-for="(item, index) in dedupedSearchResults" :key="item.objectId || item.directusId">
    <a :href="item._type === 'blogPost'
                ? (item.fullUrl || ('/blog/' + item.slug))
                : (item.itemUrl || ('/newsthatcaughtoureye/' + item.edition))" >
      <div v-lazy-load>
        <img v-if="item._type === 'News'"
             class="blog-list-img"
             data-src="/newsheader.jpg">
        <img v-else-if="item.imageFilename"
             class="blog-list-img"
             :data-src="directus._url + 'assets/' + item.imageFilename">
        <img v-else
             class="blog-list-img"
             data-src="/newsheader.jpg">
      </div>
      <div class="allposts-post-details" style="max-width:320px">
        <h3>{{ item._type === 'News' ? item.itemTitle : item.title }}</h3>
        <p class="post-date">
          Published on {{ formatDateOnly(new Date(item.date2 || item.itemDate)) }}
        </p>
        <!-- <p v-if="item._type === 'News'">{{ item.itemDescription }}</p>
        <p v-else-if="item.excerpt">{{ item.excerpt }}</p>
        <p v-else-if="item.summary">{{ item.summary }}</p> -->
        <div v-if="item._type === 'blogPost' && item.authors" class="author-list">
  <p class="author-name">
    {{ Array.isArray(item.authors) ? item.authors.join(', ') : item.authors }}
  </p>
</div>
        <div v-else-if="item._type === 'News' && item.itemAuthor" class="author-list">
          <p class="author-name">{{ item.itemAuthor }}</p>
        </div>
      </div>
    </a>

  </div>

</div>
<div class="read-more-post"  v-if="dedupedSearchResults.length > 0 && searchTerm" >
<a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
</div>

<!-- </div> -->




    
<!-- Footer Component -->
<footer-comp></footer-comp>


</template>
