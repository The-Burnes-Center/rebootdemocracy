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
                _eq: "Engagement"
              }
            }
            ]

          },
      })
      .then((item) => {
      self.articleData =  item.data;
      console.log(item);
      });
    }

  }
}
</script>

<template>
<!-- Header Component -->
<header-comp></header-comp>
<div class="resource-page our-engagements-page">
  <div class="resource-description">
    <h1>{{indexData.engagement_title}}</h1>
    <div class="our-work-description" v-html="indexData.engagement_description"></div>
    <div class="resource-menu">
      <ul>
        <li @click="selectedType = 'All'" :class="{ isActive : selectedType == 'All' }">All Engagements</li>
        <!-- <li @click="selectedType = 'Book'" :class="{ isActive : selectedType == 'Book' }">Books</li>
        <li @click="selectedType = 'Article'" :class="{ isActive : selectedType == 'Article' }">Articles</li> -->
        <!-- <li></li> -->
      </ul>
    </div>

  </div>
  <div class="resource-scroll-section">
    <div class="resource-scroller">
      <template v-for="item in articleData">
          <div class="featured-items"  v-show="item.type == selectedType || selectedType == 'All' ">
            <div class="featured-item-text">
              <div class="resource-item-img">
                 <img v-if="item.thumbnail" :src="this.directus._url + 'assets/' + item.thumbnail.id+'?width=648'">
                   <img v-if="!item.thumbnail" :src="this.directus._url + 'assets/a23c4d59-eb04-4d2a-ab9b-74136043954c?quality=80'">
              </div>
              <div class="event-tag-row" v-if="item.stage?.length > 0">
            <div class="engagement_dot" ></div>
            <p>{{item.stage?.length > 0 ? item.stage[0]:""}}</p>
          </div>
              <h5 class="eyebrow peach">Partner: {{item.partner}}</h5>
              <h4>{{item.title}}</h4>
              <p>{{item.description}}</p>
               <a class="btn btn-small btn-secondary" :href="item.link">Details <i class="fa-regular fa-arrow-right"></i></a>
            </div>
          </div>
        </template>
    </div>
  </div>
  <div class="resource-image">
  </div>
</div>
<mailing-list-comp></mailing-list-comp>
<footer-comp></footer-comp>

</template>
