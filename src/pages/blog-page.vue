<script>
import { ref, watch } from 'vue';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

import { $vfm, VueFinalModal, ModalsContainer } from 'vue-final-modal'

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
     
      animateNext: 0,
      currentDate: '',
      prevItem: 0,
      currentItem: 1,
      nextItem: 2,
      testimonialsLength:0,                               
      blogData: [],
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
    
  },
 mounted()

  { 
  this.fillMeta();
   register();
  },
  
  methods: {
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
    fetchBlog: function fetchBlog() {
      self = this;

      this.directus
      .items('reboot_democracy_blog')
      .readByQuery({
         meta: 'total_count',
         limit: 10,
         fields: [
          '*.*',
          'authors.team_id.*'
       ],
       sort:["-date"]
       
      })
      .then((item) => {
      self.blogData =  item.data;
      console.log(self.blogData )
      // self.testimonialsLength = self.blogData.testimonials.length;
      });
    },

  }
}
</script>

<template >
  <div class="workshop-hero blog-page-hero">
    <!-- Header Component -->
    <header-comp></header-comp>
    <h1>RebootDemocracy.AI blog</h1>
  </div>



<!-- News Section -->

  <div class="rdblog-section">

    <div class="row">
      <a
        :href="
          blog_item.slug
            ? '/blog/'+ blog_item.slug
            : blog_item.url
        "
        :target="
          blog_item.slug
            ? '_self' 
            :'_blank'
        "
        class="col-3"
        v-for="blog_item in blogData.slice().reverse()"
      >        <div class="blog-item">
          <div v-if="blog_item.image" class="blog-img" :style="{ backgroundImage: 'url(' + this.directus._url+'assets/'+blog_item.image.id+ ')' }"></div>
          <h4>{{blog_item.title}}</h4>
          
          <p><span v-for="(author,i) in blog_item.authors">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}<span v-if="i<blog_item.authors.length-1">,</span></span></p>
        </div>
      </a> 


    </div>
    
  </div>
        
      
    
<!-- Footer Component -->
<footer-comp></footer-comp>


</template>
