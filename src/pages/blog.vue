
<script>
import { ref, watch } from 'vue';
import { Directus } from "@directus/sdk";
import format from "date-fns/format";
import isPast from "date-fns/isPast";
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal';
import ModalComp from "../components/modal.vue";
import {useHead } from '@vueuse/head'

import { fetchBlogData } from '../helpers/blogHelper.js';

export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
        "ws-banner":
        VueFinalModal,
    ModalsContainer,
    ModalComp,
  
  },
  props: {
    slug: String,
    name: String,
  },

  data() {
    return {
      model: 0,      
      postData: [],
      slug: this.$route.params.name,
      modalData: [],
      showmodal: false,
      directus: new Directus("https://content.thegovlab.com/"),
      path: this.$route.fullPath,

          // this.debounceSearch = _.debounce(this.searchBlog, 500);
    };
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
    this.fetchBlog();
   
  },

  methods: {
  
    
    formatTimeOnly: function formatTimeOnly(d1) {
      return format(d1, "h:mm aa");
    },
    formatDateTime: function formatDateTime(d1) {
      return format(d1, "MMMM d, yyyy, h:mm aa");
    },
    formatDateOnly: function formatDateOnly(d1) {
      return format(d1, "MMMM d, yyyy");
    },
    PastDate: function PastDate(d1) {
      return isPast(d1);
    },

    async fetchBlog() {
          self =this;
           try {
        const response = await fetchBlogData.call(this, this.slug);
          self.postData = response.data;
          if (self.postData.length === 0) {
            window.location.href = "/";
          }
          console.log(self.postData);
          self.postData.length>0 ? this.fillMeta() :  this.fillMetaDefault()
      } catch (error) {
        // Handle the error
      console.error("An error occurred while fetching the blog data: ", error);
      }
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
    fillMeta()
    {
      // convert HTML body of Blog Entry into plain text
      var htmlToText = document.createElement('div');
      htmlToText.innerHTML = this.postData[0].content;
      // console.log(this.postData[0].excerpt)
  console.log(this.postData[0].image)
      
     useHead({
      title: "RebootDemocracy.AI Blog | "+this.postData[0].title,
      meta: [
        { name: 'title', content:"RebootDemocracy.AI Blog | "+this.postData[0].title },
        { name: 'description', content: this.postData[0].excerpt!=''?this.postData[0].excerpt: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'og:title', content: "RebootDemocracy.AI Blog | "+this.postData[0].title },
        { property: 'og:type', content: "website" },
        { property: 'og:url', content: "https://rebootdemocracy.ai/blog/"+this.postData[0].slug},
        // { property: 'og:description', content: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'og:description', content: this.postData[0].excerpt!=''?this.postData[0].excerpt: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'og:image', content: this.postData[0].image?this.directus._url+'assets/'+this.postData[0].image.filename_disk:this.directus._url+'assets/'+'4650f4e2-6cc2-407b-ab01-b74be4838235'},
        { property: 'og:image:width', content: this.postData[0].image.width},
        { property: 'og:image:height', content: this.postData[0].image.height},
        { property: 'twitter:title', content: "RebootDemocracy.AI"},
        { property: 'twitter:description', content: this.postData[0].excerpt!=''?this.postData[0].excerpt: htmlToText.textContent.substring(0,200)+'...'},
        { property: 'twitter:image', content:  this.postData[0].image?this.directus._url+'assets/'+this.postData[0].image.filename_disk:this.directus._url+'assets/'+'4650f4e2-6cc2-407b-ab01-b74be4838235'},
        { property: 'twitter:card', content: "summary_large_image" },
      ],
    })
    }
  },
};
</script>

<template>
   
<!-- Header Component -->
<header-comp></header-comp>

<div class="blog-hero">

  <img v-if="postData[0] && postData[0].image" class="blog-img" :src= "this.directus._url+'assets/'+postData[0].image.filename_disk+'?width=800'" />
  
  <div class="blog-details">
    <h1>{{postData[0].title}}</h1>
    <p class="excerpt"> {{postData[0].excerpt}}</p>
    <p class="post-date">Published on <b>{{formatDateOnly(new Date(postData[0].date))}}</b></p>

      <div class="hero-author-sm">
      <div v-for="(author,i) in postData[0].authors">
          <div class="author-item">
            <img v-if="author.team_id.Headshot" class="author-headshot" :src="this.directus._url+'assets/'+author.team_id.Headshot.id">
            <p  v-if="!author.team_id.Headshot" class="author-no-image">{{author.team_id.First_Name[0] }} {{author.team_id.Last_Name[0]}}</p>
            <div class="author-details">
              <p class="author-name">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}</p>
              <a class="author-bio" v-if="author.team_id.Link_to_bio" :href="author.team_id.Link_to_bio">Read Bio</a>
            </div>
          </div>
        </div>
        <div class="sm-tray">
          <a target="_blank" :href="'http://twitter.com/share?url=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-square-x-twitter"></i></a>
          <a target="_blank" :href="'https://www.facebook.com/sharer/sharer.php?u=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-facebook"></i></a>
          <a target="_blank" :href="'https://linkedin.com/shareArticle?url=https://rebootdemocracy.ai/blog/' + postData[0].slug + '&title=' + postData[0].title"><i class="fa-brands fa-linkedin"></i></a>
          <a target="_blank" :href="'https://bsky.app/intent/compose?text=https://rebootdemocracy.ai/blog/' + postData[0].slug"><i class="fa-brands fa-square-bluesky"></i></a>
          <!-- <a><i class="fa-solid fa-link"></i></a> -->
        </div>

    </div>
   
  </div>
</div>

<div class="blog-body">
  <div class="audio-version" v-if="postData[0].audio_version">
  <p dir="ltr"><em>Listen to the AI-generated audio version of this piece.&nbsp;</em></p>
    <p><audio controls="controls"><source :src="this.directus._url+'assets/'+postData[0].audio_version.id" type="audio/mpeg" data-mce-fragment="1"></audio></p>
  </div>
    <div class="blog-content" v-html="postData[0].content"></div>
    <p v-if="postData[0].ai_content_disclaimer" class="blog-img-byline">Some images in this post were generated using AI.</p>
</div>

  <!-- Footer Component -->
  <footer-comp></footer-comp>
</template>
