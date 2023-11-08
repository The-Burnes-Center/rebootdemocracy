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
      aboutData: [],
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
     this.fetchWorkshops();
       this.loadModal(); 
    },
    deep: true,
      immediate: true
  },
  },
  created() {
  
    this.loadModal(); 
    this.aboutData = this.directus.items("innovate_us");
    this.fetchAbout();
    
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
      title: "InnovateUS",
      meta: [
        { name: 'title', content:"InnovateUS" },
        { property: 'og:title', content: "InnovateUS" },
        { property: 'og:description', content: "InnovateUS provides no-cost, at-your-own pace, and live learning on data, digital and innovation skills for public servants like you."},
        { property: 'og:image', content: "https://innovate-us.org/innovateus_meta.jpg"},
        { property: 'twitter:title', content: "InnovateUS"},
        { property: 'twitter:description', content: "InnovateUS provides no-cost, at-your-own pace, and live learning on data, digital and innovation skills for public servants like you."},
        { property: 'twitter:image', content: "https://innovate-us.org/innovateus_meta.jpg"},
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
    fetchAbout: function fetchAbout() {
      self = this;

      this.directus
      .items('innovate_us')
      .readByQuery({
         meta: 'total_count',
         limit: -1,
         fields: [
          '*.*',
          'metaimg.*',
          'favicon.*',
          'featured_images.*',
          'services.innovate_us_services_id.icon.*',
          'services.innovate_us_services_id.*',
          'instructors.innovate_us_instructors_id.*',
          'instructors.innovate_us_instructors_id.headshot.*',
          'blog.innovate_us_blog_id.*',
          'blog.innovate_us_blog_id.thumbnail.*',
          'logos.innovate_us_partner_logos_id.*',
          'logos.innovate_us_partner_logos_id.logo.*',
          'partners.innovate_us_partner_logos_id.*',
          'partners.innovate_us_partner_logos_id.logo.*',
          'testimonials.innovate_us_testimonials_id.*',
          'impact.innovate_us_impact_id.*',
          'featured_instructors.innovate_us_instructors_id.headshot.*'
       ],
       
      })
      .then((item) => {
      self.aboutData =  item.data;
      self.testimonialsLength = self.aboutData.testimonials.length;
      });
    },
    fetchWorkshops: function fetchWorkshops() {
      self = this;
      this.directus
        .items("innovate_us_workshops")
        .readByQuery({
          meta: "total_count",
          limit: -1,
          fields: [
            "*.*",
            "instructor.innovate_us_instructors_id.*",
            "thumbnail.*",
          ],
        })
        .then((item) => {
          
          self.oldWsAr = item.data.sort((a, b) => {
                return  new Date(a.date) - new Date(b.date)
          });
          self.upcWsAr = item.data.sort((a, b) => {
                return  new Date(a.date) - new Date(b.date)
          });
          

          self.workshopData = self.upcWsAr.concat(self.oldWsAr.concat(self.upcWsAr));
          self.totalPageNumber = Math.ceil(self.workshopData.length / 5);

   


        });
    }

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
          blog_item.innovate_us_blog_id.slug
            ? 'blog/' + blog_item.innovate_us_blog_id.slug
            : blog_item.innovate_us_blog_id.url
        "
        :target="
          blog_item.innovate_us_blog_id.slug
            ? '_self' 
            :'_blank'
        "
        class="col-3"
        v-for="blog_item in aboutData.blog.slice().reverse()"
      >        <div class="blog-item">
          <div v-if="blog_item.innovate_us_blog_id.id" class="blog-img" :style="{ backgroundImage: 'url(' + this.directus._url+'assets/'+blog_item.innovate_us_blog_id.thumbnail.id+ ')' }"></div>
          <h4>{{blog_item.innovate_us_blog_id.title}}</h4>
          <p>{{blog_item.innovate_us_blog_id.author}}</p>
        </div>
      </a> 


    </div>
    
  </div>
        
      
    
<!-- Footer Component -->
<footer-comp></footer-comp>


</template>
