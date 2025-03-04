<script>
import { ref, watch } from 'vue';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
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
      directus: new Directus('https://content.thegovlab.com/'),
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
  filteredTagDataWithoutNews() {
    return this.filteredTagData.filter(tag => tag !== "News that caught our eye");
  }
},
  created() {
  
    this.loadModal(); 
    // this.blogData = this.directus.items("reboot_democracy_blog");
   
   
    // this.debounceSearch = _.debounce(this.searchBlog, 500);
    
  },
 mounted()

  { 
    this.fetchBlog();
    
  this.fillMeta();
   register();
  },
  
  methods: {
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
      const self = this;
      this.searchloader = true;

      if (this.searchTerm.trim().length > 0) {
        this.searchResultsFlag = 1;
        const searchTermClean = this.searchTerm.trim();

        // Clear previous search results
        this.pschatContent = '';
        this.blogDataSearch = [];

        // Start all searches in parallel
       
        // const psChatPromise = this.performPsChatSearch(searchTermClean);
         const directusPromise = this.performDirectusSearch(searchTermClean);
        const weaviatePromise = this.performWeaviateSearch(searchTermClean);
        
        

        // Handle PSChat search result as it comes in
        // psChatPromise
        //   .then((content) => {
        //     this.pschatContent = content;
        //   })
        //   .catch((error) => {
        //     console.error('Error during PSChat search:', error);
        //     this.pschatContent = 'Sorry, an error occurred during PSChat search.';
        //   });

        // Handle Directus and Weaviate search results
        try {
          const [directusData, weaviateSlugs] = await Promise.all([
            directusPromise,
            weaviatePromise,
          ]);

          // Process the search results and update blogDataSearch
          await this.processSearchResults(directusData, weaviateSlugs);
        } catch (error) {
          console.error('Error during searches:', error);
          self.blogDataSearch = [];
        } finally {
          self.searchloader = false;
        }
      } else {
        this.searchResultsFlag = 0;
        this.blogDataSearch = this.blogData; // Populate with all blog posts
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
            _and: [{ date: { _lte: '$NOW(-5 hours)' } }, { status: { _eq: 'published' } }],
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
        { property: 'og:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},
        { property: 'twitter:title', content: "RebootDemocracy.AI"},
        { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`},
        { property: 'twitter:image', content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},
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
      fetchBlog: function fetchBlog() {
      self = this;

      this.directus
      .items('reboot_democracy_blog')
      .readByQuery({
         meta: 'total_count',
         limit: -1,
          filter: {
            _and: [{ date: { _lte: '$NOW(-5 hours)' } }, { status: { _eq: 'published' } }]
          },
         fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*'
       ],
       sort:["date"]
       
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
    <h1><span>Reboot Democracy</span>Blog</h1>
    <p>The Reboot Democracy Blog explores the complex relationship among AI, democracy and governance.</p>   
    <div class="search-bar-section"> 
      <input class="search-bar" ref="searchInputRef" v-model="searchTerm" @keyup.enter="handleSearch" type="text" role="search" aria-label="Search" placeholder="Search" />
      <span @click="searchTerm = ''; resetSearch();" class="search-bar-cancel-btn material-symbols-outlined">cancel</span>
      <span @click="resetSearch()" class="search-bar-btn material-symbols-outlined">search</span>
    </div>
    <div v-if="searchloader" class="loader-blog"></div>
  </div>

<!-- Featured Blog Section -->

<div class="blog-featured" v-if="!searchResultsFlag && searchTermDisplay == ''"> 
  <div class="blog-featured-row">
    <div class="first-blog-post" v-if="latestBlogPost">
      <a :href="'/blog/' + latestBlogPost.slug">
      <div v-lazy-load>
      <img  v-if="latestBlogPost.image" class="blog-list-img" :data-src= "this.directus._url+'assets/'+ blogData.slice().reverse()[0].image.id+'?width=800'">
      </div>
      <h3>{{latestBlogPost.title}}</h3>
      <p>{{ latestBlogPost.excerpt }}</p>
       <p>Published on {{ formatDateOnly(new Date( latestBlogPost.date)) }} </p>
      <div class="author-list">
          <p  class="author-name">{{latestBlogPost.authors.length>0?'By':''}}</p>
            <div v-for="(author,i) in latestBlogPost.authors">
              <div class="author-item">               
                <div class="author-details">
                  <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                    <p class="author-name" v-if="latestBlogPost.authors.length > 1 && i < blogData.slice().reverse()[0].authors.length - 1">and</p>
                </div>
              </div>
            </div>
            
        </div>
        </a>  
        
    </div>
    <div class="other-blog-posts" v-if="!searchResultsFlag  || searchTerm == ''">
      <div class="other-post-row" v-for="(blog_item,index) in blogData.slice().reverse()"  v-show = "index > 0 && index < 4"> 
       <a :href="'/blog/' + blog_item.slug">
        <div v-lazy-load>
        <img v-if="blog_item.image" class="blog-list-img" :data-src= "this.directus._url+'assets/'+ blog_item.image.id">
        </div>
        <div class="other-post-details">
              <h3>{{blog_item.title}}</h3>
              <p>{{ blog_item.excerpt }}</p>
               <p>Published on {{ formatDateOnly(new Date( blog_item.date)) }} </p>
              <div class="author-list">
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

<div class="blog-section-header" v-if="!searchResultsFlag && searchTermDisplay == ''">
  <h2>Latest Posts </h2>
</div>

<div v-if="!searchResultsFlag && searchTermDisplay == ''"  class="allposts-section">
  <div class="allposts-post-row" v-for="(blog_item, index) in blogDataSearch.slice().reverse()" v-show="index >= 4 && index < 16">
    <a :href="'/blog/' + blog_item.slug">
          <div v-lazy-load>
        <img v-if="blog_item.image" class="blog-list-img" :data-src="this.directus._url+'assets/'+ blog_item.image.id">
      </div>
      <div class="allposts-post-details">
        <h3>{{blog_item.title}}</h3>
        <p class="post-date">Published on {{ formatDateOnly(new Date( blog_item.date)) }}</p>
        <div class="author-list">
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
                <img v-if="blog_item.image" class="blog-list-img" :data-src="this.directus._url + 'assets/' + blog_item.image.id">
              </div>
                <div class="allposts-post-details">
                  <h3>{{blog_item.title}}</h3>
                  <p class="post-date">Published on {{ formatDateOnly(new Date(blog_item.date)) }}</p>
                  <div class="author-list">
                    <p class="author-name">{{blog_item.authors.length > 0 ? 'By' : ''}}</p>
                    <div v-for="(author, i) in blog_item.authors" :key="i">
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
    </div>
  </div>
</div>

<!-- Search section -->
    <div  v-if="searchResultsFlag   && searchTermDisplay != ''" class="allposts-section">
      <div class="allposts-post-row" v-for="(blog_item, index) in blogDataSearch"> 
          <!-- <div v-if="blog_item?.Tags === null"> -->
       <a :href="'/blog/' + blog_item.slug">
                 <div v-lazy-load>
         <img v-if="blog_item.image" class="blog-list-img" :data-src= "this.directus._url+'assets/'+ blog_item.image.id">
          </div>
        <div class="allposts-post-details">
          <p class="post-date">Published on {{ formatDateOnly(new Date( blog_item.date)) }} </p>
          <h3>{{blog_item.title}}</h3>
              <div class="author-list">
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
      <a href="/all-blog-posts" class="btn btn-small btn-primary">Read All Posts</a>
    </div>




    
<!-- Footer Component -->
<footer-comp></footer-comp>


</template>
