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
                                 
      articleData: [],
      indexData: [],
      selectedType: 'All',
      directus: new Directus('https://content.thegovlab.com/'),
      path:this.$route.fullPath,
    }
  },

  created() {

    this.indexData = this.directus.items("reboot_democracy");
    this.fetchIndex(); 
    this.fetchArticle();
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

    fetchArticle: function fetchArticle() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({

         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*'
       ],
                 filter: {
                _or: [
            {
              type: {
                _eq: "Teaching"
              }
            }
            ]

          },
      })
      .then((item) => {
      self.articleData =  item.data;
      });
    }

  }
}
</script>

<template>
<!-- Header Component -->
<header-comp></header-comp>
<div class="resource-page our-teaching-page">
  <div class="resource-description">
    <h1>{{indexData.teaching_title}}</h1>
    <div class="our-work-description" v-html="indexData.teaching_description"></div>
    <div class="resource-menu">
      <ul>
        <li @click="selectedType = 'All'" :class="{ isActive : selectedType == 'All' }">All Teaching</li>
        <li @click="selectedType = 'at-your-own-pace'" :class="{ isActive : selectedType == 'at-your-own-pace' }">At-Your-Own-Pace</li>
        <!-- <li @click="selectedType = 'workshop'" :class="{ isActive : selectedType == 'workshop' }">Workshops</li> -->
         <li @click="selectedType = 'video'" :class="{ isActive : selectedType == 'video' }">Videos</li>
        <!-- <li></li> -->
      </ul>
    </div>
    
  </div>
  <div class="resource-scroll-section">
    <div class="resource-scroller">
      <v-virtual-scroll  :items="articleData">
        <template v-slot:default="{ item }">
          <div class="featured-items"  v-show="item.teaching_type == selectedType || selectedType == 'All' ">
            <div class="featured-item-text">
              <h5 class="eyebrow">{{item.teaching_type}}</h5>
              <div class="resource-item-img">
                 <img v-if="item.thumbnail" :src="this.directus._url + 'assets/' + item.thumbnail.id">
                   <img v-if="!item.thumbnail" src="../assets/workplace-image.png">
              </div>
              <h4>{{item.title}}</h4>
              <p>{{item.description}}</p>
               <a class="btn btn-small btn-tertiary" :href="item.link">Details <i class="fa-regular fa-arrow-right"></i></a>
            </div>
          </div>
        </template>
      </v-virtual-scroll>
    </div>
  </div>
  <div class="resource-image">
  </div>
</div>
<mailing-list-comp></mailing-list-comp>
<footer-comp></footer-comp>

</template>
