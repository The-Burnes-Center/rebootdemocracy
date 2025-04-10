<script>
import { ref, watch } from 'vue';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

import { VueFinalModal, ModalsContainer } from 'vue-final-modal'

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import ModalComp from "../components/modal.vue";
import MailingListComponent from "../components/mailing.vue";
import OpenAIChat from "../components/pschat.vue";
// import { register } from 'swiper/element/bundle';
// import {useHead } from '@vueuse/head'


export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "mailing-list-comp": MailingListComponent,
    "openai-chat":OpenAIChat,
  //   "generative-ai-banner-comp":GenerativeAIBannerComponent,
    "ws-banner":
        VueFinalModal,
    ModalsContainer,
    ModalComp,
  },
  
  data() {
    return {
      model: 0,                          
      indexData: [],
      eventsData: [],
      featuredData:[],
      researchData: [],
      writingData: [],
      teachingData:[],
      engagementData: [],
      eelData: [],
      modalData: [],
      showmodal: false,
      moreresourceData: [],
      item_counter: 0,
      directus: new Directus('https://dev.thegovlab.com/'),
      path:this.$route.fullPath,
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

    this.indexData = this.directus.items("reboot_democracy");
    this.item_counter = 0;
      this.loadModal(); 
    this.fetchEvents();
    this.fetchFeatured();
    this.fetchIndex();
    this.fetchResearch();
    this.fetchWriting();
    this.fetchEngagements();
    this.fetchEEL();
    this.fetchTeaching();
    this.fetchMoreResources();
  },
//  mounted()

//   { 
//   this.fillMeta();
//    register();
//   },
  
  methods: {
    fillMeta()
    {
    //  useHead({
    //   title: "InnovateUS",
    //   meta: [
    //     { name: 'title', content:"InnovateUS" },
    //     { property: 'og:title', content: "InnovateUS" },
    //     { property: 'og:description', content: "InnovateUS provides no-cost, at-your-own pace, and live learning on data, digital and innovation skills for public servants like you."},
    //     { property: 'og:image', content: "https://innovate-us.org/innovateus_meta.jpg"},
    //     { property: 'twitter:title', content: "InnovateUS"},
    //     { property: 'twitter:description', content: "InnovateUS provides no-cost, at-your-own pace, and live learning on data, digital and innovation skills for public servants like you."},
    //     { property: 'twitter:image', content: "https://innovate-us.org/innovateus_meta.jpg"},
    //     { property: 'twitter:card', content: "summary_large_image" },
    //   ],
    // })
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

    fetchIndex: function fetchIndex() {
      self = this;

      this.directus
      .items('reboot_democracy')
      .readByQuery({
         meta: 'total_count',
         limit: -1,
         fields: [
          '*.*'
       ],
       
      })
      .then((item) => {
      self.indexData =  item.data;
      });
    },
    fetchEvents: function fetchEvents() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
          filter: {
            _and: [
            {
              type: {
                _eq: "Event"
              }
            },
              {
              date: {
                _gte:  "$NOW"
              }
            }
            ]
          },
         meta: 'total_count',
         limit: 2,
         sort:["date"],
         fields: [
          '*.*','thumbnail.*','event_series.general_events_series_id.*'
       ],
       
      })
      .then((item) => {
      self.eventsData =  item.data;
      });
    },
    // fetchFeatured: function fetchFeatured() {
    //   self = this;

    //   this.directus
    //   .items('reboot_democracy_resources')
    //   .readByQuery({
    //       filter: {
    //         featured: {
    //           _eq: 'true',
    //         },
    //       },
    //      meta: 'total_count',
    //      limit: 3,
    //      sort:["-date"],
    //      fields: [
    //       '*.*','thumbnail.*', 'authors.team_id.*'
    //    ],
       
    //   })
    //   .then((item) => {
    //   self.featuredData =  item.data;
    //   });
    // },
    fetchFeatured: function fetchFeatured() {
      self = this;


      this.directus
      .items('reboot_democracy_blog')
      .readByQuery({
          filter: {
            status: {
              _eq: 'published',
            },
          },
         meta: 'total_count',
         limit: 6,
         sort:["-date"],
         fields: [
          '*.*',          
          'authors.team_id.*',
          'authors.team_id.Headshot.*'
       ],
       
      })
      .then((item) => {
      self.featuredData =  item.data;

      self.preloadImages();
      });
    },
    

    fetchResearch: function fetchResearch() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
            filter: {
              type: {
                _eq: "Case Study"
              }
          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*'
       ],
       
      })
      .then((item) => {
      self.researchData =  item.data;
      });
    },
    fetchWriting: function fetchWriting() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
                 filter: {
                _or: [
            {
              type: {
                _eq: "Article"
              }
            },
                        {
              type: {
                _eq: "Book"
              }
            }
            ]

          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*', 'authors.team_id.*'
       ],
       
      })
      .then((item) => {
      self.writingData =  item.data;
      });
    },
    fetchTeaching: function fetchTeaching() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
                 filter: {
                _or: [
            {
              type: {
                _eq: "Teaching"
              }
            }
            ]

          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*'
       ],
       
      })
      .then((item) => {
      self.teachingData =  item.data;
      });
    },

    fetchEEL: function fetchEEL() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
                 filter: {
                _or: [
            {
              type: {
                _eq: "Equitable Engagement Lab"
              }
            }
            ]

          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*'
       ],
       
      })
      .then((item) => {
      self.eelData =  item.data;
      });
    },

    fetchEngagements: function fetchEngagements() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
                 filter: {
                _or: [
            {
              type: {
                _eq: "Engagement"
              }
            }
            ]

          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*'
       ],
       
      })
      .then((item) => {
      self.engagementData =  item.data;
      });
    },

    fetchMoreResources: function fetchMoreResources() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
                 filter: {
                _or: [
            {
              type: {
                _eq: "Video"
              }
            },
                        {
              type: {
                _eq: "Podcast"
              }
            },
                                    {
              type: {
                _eq: "Resources"
              }
            }
            ]

          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*'
       ],
       
      })
      .then((item) => {
      self.moreresourceData =  item.data;
      });
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
    preloadImages() {
      this.featuredData.forEach(item => {
        if (item.image) {
          const img = new Image();
          img.src = this.directus._url + 'assets/' + item.image.id + '?width=438';
          // You can also add event listeners here if you want to handle load or error events
        }
      });
    }
  },

}
</script>

<template>


      <vue-final-modal  v-if="showmodal" @before-close="closeModal" v-model="showmodal" classes="modal-container" content-class="modal-comp">
      <ModalComp :modalData="modalData" @close="closeModal" />
    </vue-final-modal>

<!-- Header Component -->
<header-comp></header-comp>
<img src="http://localhost:3001/.netlify/images?url=https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/4b15233a-16ed-4cef-8935-124455a382f0.png&w=500" />
<!-- Hero Section -->
<div class="hero">
    <video autoplay loop muted playsinline>
        <source src="/src/assets/liquid_ai_animation.mp4" type="video/mp4" title="generated with https://runwayml.com/">
        Your browser does not support the video tag.
    </video>
  <div class="hero-fallback-image"></div>
  <div class="hero-content">
    <h1 class="eyebrow blue">{{indexData.title}}</h1>
    <h1 class="title" v-html="indexData.subtitle"></h1>
  </div>

  
  <div class="featured-section">
    <v-carousel  hide-delimiters v-model="model">
      <v-carousel-item class="index_carousel" v-for="(item,i) in featuredData" :key="i" >
    <div class="featured-content">
        <h1 class="eyebrow">From the Blog</h1>
        <div class="featured-image">
          <img v-if="item.image" :src="this.directus._url+'assets/'+item.image.id+'?width=438'">
          <!-- <img v-if="!item.thumbnail"  src="..//assets/media-image.png"> -->
        </div>
          <h4>{{item.title}}</h4>
          <p>{{ formatDateOnly (new Date (item.date) )}}</p>
           <p v-if="item.authors == '' && item.type != 'Event'" class="featured-event-description">{{item.description}}</p>
          <p v-if="item.type == 'Event'">{{formatDateTime(new Date(item.date))}}</p>
          <p v-if="item.authors != ''">By <span v-for="(author,index) in item.authors">{{author.team_id.First_Name}} {{author.team_id.Last_Name}}<span v-if="index < item.authors.length - 1">, </span></span></p>
          <div class="speakers-list" v-show="item.speakers" v-html="item.speakers"></div>
          <a class="btn btn-small btn-blue" :href="'blog/'+item.slug">Details <i class="fa-regular fa-arrow-right"></i></a>
    </div>
    </v-carousel-item>
    </v-carousel>
  </div>
</div>


<!-- Our Mission Section -->

<div id="about" class="mission-section">
  <div class="mission-text">
      <h2 class="eyebrow peach">{{indexData.mission_title}}</h2>
      <div v-html="indexData.mission_heading"></div>
      <div class="mission-description" v-html="indexData.mission_description"></div>
        <!-- <a class="btn btn-medium btn-secondary">About Us</a> -->
  </div>
  
  <div class="mission-image">

  </div>

</div>


<!-- Upcoming Events -->

<div class="upcoming-events-section" v-show="!eventsData">
  <div class="upcoming-events-box">
    <div class="upcoming-events-text">
        <h3>Reboot Democracy Lecture Series</h3>
        <div class="our-work-description"><p>Upcoming events in the Reboot Democracy Lecture Series</p></div>
         <a class="btn btn-ghost btn-dark btn-medium" href="/events/reboot-democracy" target="_blank">View all events</a>
         <div class="col-50-home">
        <!-- <p>Join our mailing list</p> -->
         <!-- <input type="text" placeholder="" name="entry.250007595" aria-hidden=”true”> -->
        <!-- <a href="/signup" class="btn btn-primary btn-dark btn-medium">Sign up to receive updates!</a> -->
      </div>
    </div>
    <div class="upcoming-events-content">
      <div class="upcoming-events-item" v-for="resource_item in eventsData"  v-show="FutureDate(new Date(resource_item.date))">

              <img v-if="!resource_item.instructor && resource_item.thumbnail" :src="this.directus._url + 'assets/' + resource_item.thumbnail.id+'?width=334'">
              <h4>{{resource_item.title}}</h4>
              <div style="display:flex;flex-direction: column"><p><b>Speakers:&nbsp</b></p><div  v-html="resource_item.speakers"></div></div>
              <p>{{formatDateOnly(new Date(resource_item.date))}}</p>
              <a class="btn btn-small btn-primary" :href="resource_item.link" target="_blank">Read More  <i class="fa-regular fa-arrow-right"></i></a>
      </div>
    </div>
  </div>
</div>

<!-- Equitable Engagement Lab Section-->

<div class="our-work-section">
    <div class="our-work-image equitable-engagement-img">
      <img src="../assets/eel-image.png">
    </div>
    <!-- <div class="our-work-separator">
  <div class="our-work-separator-text">
    <h2 class="eyebrow white">{{indexData.our_work_title}}</h2>
    <p>{{indexData.our_work_subtitle}}</p>
  </div>
</div> -->
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.equitable_engagement_lab_title}}</h3>
        <div class="our-work-description" v-html="indexData.equitable_engagement_lab_description"></div>
        <!-- <a class="btn btn-small btn-ghost">About the lab <i class="fa-regular fa-arrow-right"></i></a> -->
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="resource_item in eelData.slice(0, 6)" >
            <div class="resource-item">
                <div class="resource-item-img">
                 <img v-if="resource_item.thumbnail" :src="this.directus._url + 'assets/' + resource_item.thumbnail.id">
                 <img v-if="!resource_item.thumbnail" src="../assets/eel-image.png">
              </div>
              <div class="resource-item-text">
              <h4>{{resource_item.title}}</h4>
              <p>{{resource_item.description}}</p>
              <a class="btn btn-small btn-tertiary" :href="resource_item.link" target="_blank">Read More <i class="fa-regular fa-arrow-right"></i></a>
            </div>
            </div>
          </div>
        </div>

        <div class="join-section">
          <div class="join-text">
            <h3>{{indexData.join_the_lab_title}}</h3>
            <div v-html="indexData.join_the_lab_description"></div>
            <a class="btn btn-primary btn-dark btn-medium">Join the Lab</a>
          </div>
        </div>
      </div>
    </div>
</div>
<!-- Our Experience Section -->

<div id="about" class="mission-section">
  <div class="mission-text">
      <h2 class="eyebrow peach">{{indexData.experience_title}}</h2>
      <h2>{{indexData.experience_heading}}</h2>
      <div class="mission-description" v-html="indexData.experience_description"></div>
        <!-- <a class="btn btn-medium btn-secondary">About Us</a> -->
  </div>
  <div class="mission-image">

  </div>

</div>


<!-- Our Work Separator-->

<div class="our-work-separator">
  <div class="our-work-separator-text">
    <h2 class="eyebrow white">{{indexData.our_work_title}}</h2>
    <p>{{indexData.our_work_subtitle}}</p>
  </div>
</div>



<!-- Our Past Engagements Section-->
<div class="our-work-section">
    <div class="our-work-image research-img">
       <img src="../assets/media-image.png">
    </div>
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.engagement_title}}</h3>
        <div class="our-work-description" v-html="indexData.engagement_description"></div>
        
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="resource_item in engagementData.slice().reverse().slice(0, 6)" >
            <div class="resource-item">
                <div class="resource-item-img">
                 <img v-if="resource_item.thumbnail" :src="this.directus._url + 'assets/' + resource_item.thumbnail.id+'?width=566'">
                   <img v-if="!resource_item.thumbnail" src="../assets/workplace-image.png">
              </div>
              <div class="resource-item-text">
                
               <!-- <h5 class="eyebrow">{{resource_item.type}}</h5> -->
               <div class="event-tag-row" v-if="resource_item.stage?.length > 0">
            <div class="engagement_dot" ></div>
            <p>{{resource_item.stage?.length > 0 ? resource_item.stage[0]:""}}</p>
          </div>
              <h4>{{resource_item.title}}</h4>
              <p>{{resource_item.description}}</p>
              <a class="btn btn-small btn-tertiary" :href="resource_item.link" target="_blank">Read More  <i class="fa-regular fa-arrow-right"></i></a>
            </div>
          </div>
          </div>
        </div>
        <a class="btn btn-small btn-ghost" href="/our-engagements">More Engagements<i class="fa-regular fa-arrow-right"></i></a>
      </div>
    </div>
</div>


<!-- Our Research Section-->
<div class="our-work-section">
    <div class="our-work-image research-img">
       <img src="../assets/research-image.png">
    </div>
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.research_title}}</h3>
        <div class="our-work-description" v-html="indexData.research_description"></div>
        
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="resource_item in researchData.slice(0, 6)" >
            <div class="resource-item">
              <div class="resource-item-img">
                
                 <img v-if="resource_item.thumbnail" :src="this.directus._url + 'assets/' + resource_item.thumbnail.id+'?width=566'">
                  <!-- <img v-if="!resource_item.thumbnail" src="../assets/workplace-image.png"> -->
              </div>
              <div class="resource-item-text">
                <h5 class="eyebrow">{{resource_item.type}}</h5>
                <h4>{{resource_item.title}}</h4>
                <p>{{resource_item.description}}</p>
                <a class="btn btn-small btn-tertiary" :href="resource_item.link" target="_blank">Read More  <i class="fa-regular fa-arrow-right"></i></a>
              </div>
            </div>
          </div>
        </div>
        <a class="btn btn-small btn-ghost" href="/our-research">More Research<i class="fa-regular fa-arrow-right"></i></a>
      </div>
    </div>
</div>

<!-- Our Writing Section-->
<div class="our-work-section">
    <div class="our-work-image writing-img">
       <img src="../assets/writing-image.png">
    </div>
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.writing_title}}</h3>
        <div class="our-work-description" v-html="indexData.writing_description"></div>
        
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="resource_item in writingData.slice().reverse().slice(0, 6)">
            <div class="resource-item">
              <div class="resource-item-img">
                 <img v-if="resource_item.thumbnail" :src="this.directus._url + 'assets/' + resource_item.thumbnail.id+'?width=566'">
                   <img v-if="!resource_item.thumbnail" src="../assets/workplace-image.png">
              </div>
              <div class="resource-item-text">
               <h5 class="eyebrow">{{resource_item.type}}</h5>
              <h4>{{resource_item.title}}</h4>
              <p>By <span v-for="(author,index) in resource_item.authors">{{author.team_id.name}}<span v-if="index < resource_item.authors.length - 1">, </span></span></p>
              <a class="btn btn-small btn-tertiary" :href="resource_item.link" target="_blank">Read More  <i class="fa-regular fa-arrow-right"></i></a>
            </div>
            </div>
          </div>
        </div>
        <a class="btn btn-small btn-ghost" href="/our-writing">More Writing<i class="fa-regular fa-arrow-right"></i></a>
      </div>
    </div>
</div>

<!-- Our Teaching Section-->
<div class="our-work-section">
    <div class="our-work-image writing-img">
       <img src="../assets/workplace-image.png">
    </div>
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.teaching_title}}</h3>
        <div class="our-work-description" v-html="indexData.teaching_description"></div>
        
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="resource_item in teachingData.slice(0, 6)">
            <div class="resource-item">
              <div class="resource-item-img">
                 <img v-if="resource_item.thumbnail" :src="this.directus._url + 'assets/' + resource_item.thumbnail.id+'?width=566'">
                   <img v-if="!resource_item.thumbnail" src="../assets/workplace-image.png">
              </div>
              <div class="resource-item-text">
               <h5 class="eyebrow">{{resource_item.type}}</h5>
              <h4>{{resource_item.title}}</h4>
              <p>{{resource_item.description}}</p>
              <a class="btn btn-small btn-tertiary" :href="resource_item.link" target="_blank">Read More  <i class="fa-regular fa-arrow-right"></i></a>
            </div>
            </div>
          </div>
        </div>
        <a class="btn btn-small btn-ghost" href="/our-teaching">More Teaching<i class="fa-regular fa-arrow-right"></i></a>
      </div>
    </div>
</div>


<!-- Our Other Resources Section-->
<div class="our-work-section">
    <div class="our-work-image writing-img">
       <img src="../assets/media-image.png">
    </div>
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.more_resources_title}}</h3>
        <div class="our-work-description" v-html="indexData.more_resources_description"></div>
        
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="resource_item in moreresourceData.slice(0, 6)" >
            <div class="resource-item">
                <div class="resource-item-img">
                 <img v-if="resource_item.thumbnail" :src="this.directus._url + 'assets/' + resource_item.thumbnail.id+'?width=566'">
                  <img v-if="!resource_item.thumbnail" src="../assets/workplace-image.png">
              </div>
              <div class="resource-item-text">
              <h5 class="eyebrow">{{resource_item.type}}</h5>
              <h4>{{resource_item.title}}</h4>
              <p>{{resource_item.description}}</p>
              <a class="btn btn-small btn-tertiary" :href="resource_item.link" target="_blank">Read More  <i class="fa-regular fa-arrow-right"></i></a>
            </div>
            </div>
          </div>
        </div>
        <a class="btn btn-small btn-ghost" href="/more-resources">More Resources<i class="fa-regular fa-arrow-right"></i></a>
      </div>
    </div>
</div>

<!-- Other practice section. Consider making repeatable and moving to directus-->

<!-- <div class="other-practice">
  <div class="col-50">
      <div class="other-practice-img workplace-img">
       <img src="../assets/workplace-image.png">
    </div>
    <div class="other-practice-title">
      <h3><a href="https://poweratwork.us/" target="_blank"> Workplace Democracy <i class="fa-regular fa-arrow-right"></i></a></h3>
    </div>
  </div>
  <div class="col-50">
    <div class="other-practice-img media-img">
       <img src="../assets/media-image.png">
    </div>
    <div class="other-practice-title">
      <h3>Media and Democracy <i class="fa-regular fa-arrow-right"></i></h3>
    </div>
  </div>
</div> -->
<mailing-list-comp></mailing-list-comp>
<footer-comp></footer-comp>

</template>
