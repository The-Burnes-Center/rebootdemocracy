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
import {useHead } from '@vueuse/head'

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
  created() {
  
    this.loadModal(); 
    this.blogData = this.directus.items("reboot_democracy_blog");
    this.fetchBlog();
    this.resetSearch();
    // this.debounceSearch = _.debounce(this.searchBlog, 500);
    
  },
 mounted()

  { 
  this.fillMeta();
   register();
  },
  
  methods: {
    searchBlog() {
      self = this;
      this.searchloader = true;
      let searchTArray = this.searchTerm.split(" ");
      searchTArray = searchTArray.filter(item => item); // filter out empty entries
      const searchObj = [];
        searchTArray.map((a) => {
        searchObj.push({ excerpt: { _contains: a }  });
        searchObj.push({ title: { _contains: a } } );
        searchObj.push({ content: { _contains: a }  });
        searchObj.push({ authors: { team_id: { First_Name: { _contains: a } } } });
        searchObj.push({ authors: { team_id: { Last_Name: { _contains: a } } } });
        searchObj.push({ authors: { team_id: { Title: { _contains: a } } } });
      });
      if (searchTArray.length > 0)
      {
        this.searchResultsFlag = 1;
        // console.log(this.searchResultsFlag);
      }
      else
        this.searchResultsFlag = 0;
      this.directus
      .items('reboot_democracy_blog')
      .readByQuery({
          limit:-1,
          filter: {
            _and: [ { date: { _lte: "$NOW(-5 hours)" }},
            {
               status: {
              _eq: "published",
            },
            }
            ],
            _or: searchObj,
          },
          sort:["date"],
          fields: ['*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*'],
        })
        .then((b) => {
          this.blogDataSearch = b.data;
          console.log(this.blogDataSearch, 'searchResults');
          this.searchloader = false;
        });
    },
    resetSearch() {
      (this.blogDataSearch = []);
      this.searchactive = false;
      this.searchResultsFlag = 0;
      this.searchTermDisplay = this.searchTerm;
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

    loadModal() {
     self = this;
      this.directus
      .items('innovate_us_modal')
      .readByQuery({     
          meta: 'total_count',
         limit: -1,
         fields: [
          '*.*']
      }).then((item) => {
      self.modalData = item.data;
      
      self.showmodal = localStorage.getItem(self.modalData.campaigns.campaign_name) != "off" && self.modalData.status== 'published'?true:false;
      })
    },
    closeModal() {
     this.showmodal=false;
     localStorage.setItem(this.modalData.campaigns.campaign_name,"off");
     
     // edgecase if modal opens and the workshop banner is not in
     this.$refs.banner.slider.scrollLeft == 0 ? this.$refs.banner.sliderPos() : '';

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
      fetchBlog: function fetchBlog() {
      self = this;

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
       sort:["date"]
       
      })
      .then((item) => {
      self.blogData =  item.data;
      console.log(self.blogData )
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
      console.log(this.filteredTagData)
      // self.testimonialsLength = self.blogData.testimonials.length;
      });
    },

  }
}
</script>

<template>
    <!-- Header Component -->
    <header-comp></header-comp>
  <div class="blog-page-hero">
    <h1 class="eyebrow">Reboot Democracy</h1>
    <h1>Blog</h1>   
      <div class="search-bar-section">      
      <input
          class="search-bar"
          v-model="searchTerm"
          @keyup.enter="resetSearch()"
          type="text"
          placeholder="SEARCH"/>
            
            <span type="submit"
            @click="searchTerm = '';
            resetSearch();"
            class="search-bar-cancel-btn material-symbols-outlined">
                cancel
            </span>

          <span type="submit"
            @click="
            resetSearch()"
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
    <div class="first-blog-post">
      <a :href="'/blog/' + blogData.slice().reverse()[0].slug">
      <img  v-if="blogData.slice().reverse()[0].image" class="blog-list-img" :src= "this.directus._url+'assets/'+ blogData.slice().reverse()[0].image.id+'?width=800'">
      <h3>{{blogData.slice().reverse()[0].title}}</h3>
      <p>{{ blogData.slice().reverse()[0].excerpt }}</p>
       <p>Published on {{ formatDateOnly(new Date( blogData.slice().reverse()[0].date)) }} </p>
      <div class="author-list">
          <p  class="author-name">{{blogData.slice().reverse()[0].authors.length>0?'By':''}}</p>
            <div v-for="(author,i) in blogData.slice().reverse()[0].authors">
              <div class="author-item">
               
                <!-- <img class="author-headshot" :src="this.directus._url+'assets/'+author.team_id.Headshot.id"> -->
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
       <a :href="'/blog/' + blog_item.slug">
        <img v-if="blog_item.image" class="blog-list-img" :src= "this.directus._url+'assets/'+ blog_item.image.id">
        <div class="other-post-details">
              <h3>{{blog_item.title}}</h3>
              <p>{{ blog_item.excerpt }}</p>
               <p>Published on {{ formatDateOnly(new Date( blog_item.date)) }} </p>
              <div class="author-list">
                   <p  class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
                    <div v-for="(author,i) in blog_item.authors">
                      <div class="author-item">
                        <!-- <img class="author-headshot" :src="this.directus._url+'assets/'+author.team_id.Headshot.id"> -->
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

<!-- Filtered Posts Section -->
<h2  v-if="searchResultsFlag   && searchTermDisplay != ''" class="search-term">Searching for <i>{{searchTermDisplay}}</i> </h2>
<div v-if="searchResultsFlag  || searchTerm == ''">

<div class="allposts-section">
  <div v-for="(tag_item) in this.filteredTagData" class="all-posts-row">
    <div class="blog-section-header">
        <h2 v-if="!searchResultsFlag && searchTermDisplay == ''">{{ tag_item }}</h2>
    </div>
    <div class="tag-posts-row-container">
    <div  v-for="(blog_item,index) in blogDataSearch.slice().reverse()" class="tag-posts-row">
      <div v-if="this.inclucesString(blog_item?.Tags,tag_item)">
       <a :href="'/blog/' + blog_item.slug">
        <div class="allposts-post-details">
              <h3>{{blog_item.title}}</h3>
               <p class="post-date">Published on {{ formatDateOnly(new Date( blog_item.date)) }} </p>
              <div class="author-list">
                   <p  class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
                    <div v-for="(author,i) in blog_item.authors">
                      <div class="author-item">
                        <!-- <img class="author-headshot" :src="this.directus._url+'assets/'+author.team_id.Headshot.id"> -->
                        <div class="author-details">
                          <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                          <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
                        </div>
                      </div>
                    </div>
                  </div>
            </div>
         <img v-if="blog_item.image" class="blog-list-img" :src= "this.directus._url+'assets/'+ blog_item.image.id">
         </a>
        </div>
      </div>
</div>
</div>
</div>
</div>



<!-- Latest Posts -->

<div class="blog-section-header" v-if="!searchResultsFlag && searchTermDisplay == ''">
  <h2>Latest Posts </h2>
</div>


<div v-if="!searchResultsFlag && searchTermDisplay == ''">
      <div class="allposts-section">
      <div class="allposts-post-row" v-for="(blog_item) in blogDataSearch.slice().reverse()"> 
          <!-- <div v-if="blog_item?.Tags === null"> -->
       <a :href="'/blog/' + blog_item.slug">
        <div class="allposts-post-details">
              <h3>{{blog_item.title}}</h3>
               <p class="post-date">Published on {{ formatDateOnly(new Date( blog_item.date)) }} </p>
              <div class="author-list">
                   <p  class="author-name">{{blog_item.authors.length>0?'By':''}}</p>
                    <div v-for="(author,i) in blog_item.authors">
                      <div class="author-item">
                        <!-- <img class="author-headshot" :src="this.directus._url+'assets/'+author.team_id.Headshot.id"> -->
                        <div class="author-details">
                          <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
                          <p class="author-name" v-if="blog_item.authors.length > 1 && i < blog_item.authors.length - 1">and</p>
                        </div>
                      </div>
                    </div>
                  </div>
            </div>
         <img v-if="blog_item.image" class="blog-list-img" :src= "this.directus._url+'assets/'+ blog_item.image.id">
         </a>
      </div>
      </div>
</div>

    
<!-- Footer Component -->
<footer-comp></footer-comp>


</template>
