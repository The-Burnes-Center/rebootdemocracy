<script>
import { ref, watch } from 'vue';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';

// import { $vfm, VueFinalModal, ModalsContainer } from 'vue-final-modal'

import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import MailingListComponent from "../components/mailing.vue";
// import { register } from 'swiper/element/bundle';
// import {useHead } from '@vueuse/head'


export default {
  components: {
    "header-comp": HeaderComponent,
    "footer-comp": FooterComponent,
    "mailing-list-comp": MailingListComponent,
  //   "generative-ai-banner-comp":GenerativeAIBannerComponent,
  //   "ws-banner":WsBanner,
  //       VueFinalModal,
  //   ModalsContainer,
  //   ModalComp,
  },
  
  data() {
    return {
                                 
      indexData: [],
      featuredData:[],
      directus: new Directus('https://directus9.thegovlab.com/'),
      path:this.$route.fullPath,
    }
  },

  created() {

    this.indexData = this.directus.items("reboot_democracy");
    this.fetchIndex();
    this.fetchFeatured();
    
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
    fetchFeatured: function fetchFeatured() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
          filter: {
            featured: {
              _eq: true,
            },
          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*'
       ],
       
      })
      .then((item) => {
      self.featuredData =  item.data;
      });
    }

  }
}
</script>

<template>
<!-- Header Component -->
<header-comp></header-comp>

<!-- Hero Section -->
<div class="hero">
  <div class="hero-content">
    <h1 class="eyebrow blue">{{indexData.title}}</h1>
    <h1 class="title" v-html="indexData.subtitle"></h1>
  </div>
</div>

<!-- Featured Box -->
<div class="featured-box">
  <h2 class="eyebrow">The latest</h2>
  <div class="featured-layout">
    <div class="featured-column">
      <div class="top-feature">
        <div class="top-feature-text">
          <h3 class="eyebrow">{{featuredData[0].type}}</h3>
          <h4>{{featuredData[0].title}}</h4>
          <p>{{featuredData[0].description}}</p>
          <a class="btn btn-small btn-ghost">Details <i class="fa-regular fa-arrow-right"></i></a>
        </div>
        <div class="top-featured-image">
          <img :src="this.directus._url+'assets/'+featuredData[0].thumbnail.id">
        </div>

      </div>
      <div class="secondary-featured">
        <div class="secondary-featured-column" v-for="(featured_item,index) in featuredData" v-show="index > 0 && index < 3">
        <div class="secondary-featured-text">
          <h3 class="eyebrow">{{featured_item.type}}</h3>
          <h4>{{featured_item.title}}</h4>
          <p>{{featured_item.description}}</p>
          <a class="btn btn-small btn-ghost">Details <i class="fa-regular fa-arrow-right"></i></a>
        </div>
        </div>
      </div>
    </div>

    <div class="featured-column desktop-feature">
      <v-virtual-scroll  :items="featuredData">
        <template v-slot:default="{ item }">
          <div class="featured-items">
            <div class="featured-item-text">
              <h3 class="eyebrow">{{item.type}}</h3>
              <h4>{{item.title}}</h4>
              <p>{{item.description}}</p>
            </div>
          </div>
        </template>
      </v-virtual-scroll>
    </div>  
    <div class="featured-column mobile-feature">
      <v-sheet
        class="mx-auto"
      >
        <v-slide-group
          show-arrows
          selected-class="bg-primary"
        >
          <v-slide-group-item
            v-for="item in featuredData"
            :key="item"
            v-slot="{ isSelected, toggle }"
          >
              <div class="featured-items">
                <div class="featured-item-text">
                  <h3 class="eyebrow">{{item.type}}</h3>
                  <h4>{{item.title}}</h4>
                  <p>{{item.description}}</p>
                </div>
              </div>
          </v-slide-group-item>
        </v-slide-group>
      </v-sheet>
    </div>

  </div>
</div>







<!-- Our Mission Section -->

<div class="mission-section">
  <div class="mission-text">
      <h2 class="eyebrow peach">{{indexData.mission_title}}</h2>
      <div v-html="indexData.mission_heading"></div>
      <div class="mission-description" v-html="indexData.mission_description"></div>
        <a class="btn btn-medium btn-secondary">About Us</a>
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


<!-- Equitable Engagement Lab Section-->

<div class="our-work-section">
    <div class="our-work-image equitable-engagement-img">
      <img src="../assets/eel-image.png">
    </div>
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.equitable_engagement_lab_title}}</h3>
        <div class="our-work-description" v-html="indexData.equitable_engagement_lab_description"></div>
        <a class="btn btn-small btn-ghost">About the lab <i class="fa-regular fa-arrow-right"></i></a>
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="(resource_item,index) in featuredData" v-show="index < 6">
            <div class="resource-item">
              <h4>Collective Intelligence</h4>
              <p>It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with</p>
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

<!-- Our Research Section-->
<div class="our-work-section">
    <div class="our-work-image research-img">
       <img src="../assets/research-image.png">
    </div>
    <div class="our-work-layout">
      <div class="our-work-text">
        <h3>{{indexData.research_title}}</h3>
        <!-- <div class="our-work-description" v-html="indexData.equitable_engagement_lab_description"></div> -->
        
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="(resource_item,index) in featuredData" v-show="index < 6">
            <div class="resource-item">
              <h4>Collective Intelligence</h4>
              <p>It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with</p>
            </div>
          </div>
        </div>
        <a class="btn btn-small btn-ghost">More Research<i class="fa-regular fa-arrow-right"></i></a>
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
        <!-- <div class="our-work-description" v-html="indexData.equitable_engagement_lab_description"></div> -->
        
      </div>
      <div class="two-col-resources">
        <div class="resource-row">
          <div class="resource-col"  v-for="(resource_item,index) in featuredData" v-show="index < 6">
            <div class="resource-item">
              <h4>Collective Intelligence</h4>
              <p>It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with</p>
            </div>
          </div>
        </div>
        <a class="btn btn-small btn-ghost">More Writing<i class="fa-regular fa-arrow-right"></i></a>
      </div>
    </div>
</div>

<!-- Other practice section. Consider making repeatable and moving to directus-->

<div class="other-practice">
  <div class="col-50">
      <div class="other-practice-img workplace-img">
       <img src="../assets/workplace-image.png">
    </div>
    <div class="other-practice-title">
      <h3>Workplace Democracy <i class="fa-regular fa-arrow-right"></i></h3>
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
</div>
<mailing-list-comp></mailing-list-comp>
<footer-comp></footer-comp>

</template>
