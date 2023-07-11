
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
      eventsData:[],
      InnovateUSData:[],
      selectedStatus: undefined,
      eventTitle: "",
      eventDescription: "",
      seriesData:[],
      alleventsData: [],
      directus: new Directus('https://directus9.thegovlab.com/'),
      path:this.$route.fullPath,
    }
  },

  created() {

    this.indexData = this.directus.items("reboot_democracy");
    this.fetchIndex();
    this.fetchEvents();
    this.fetchInnovateUS();
    this.fetchSeries();  
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

      formatSeriesData: async function formatSeriesData() {

         self = this;

        if(self.selectedStatus == undefined) {
          self.eventTitle = "";
          self.eventDescription = "";
          this.alleventsData = this.eventsData.concat(this.InnovateUSData);
          this.alleventsData.sort((a, b) => a.event_element.date - b.event_element.date);
          
        }
        else if (self.selectedStatus != undefined){
          self.eventTitle = self.selectedStatus.title;
          self.eventDescription = self.selectedStatus.description;

          if(self.selectedStatus.title == "InnovateUS Workshops"){
              
            //  this.InnovateUSData_elements = this.InnovateUSData.map(obj => obj.event_element);
            this.alleventsData = this.InnovateUSData;
            this.alleventsData.sort((a, b) => a.event_element.date - b.event_element.date);
          }

          else if(self.selectedStatus.title != "InnovateUS Workshops"){
          // this.eventsData_elements = this.eventsData.map(obj => obj.event_element);
          let tempData = this.eventsData.filter(function (e) {
          return e.event_element.event_series[0].general_events_series_id.title == self.selectedStatus.title
        });
          this.alleventsData = tempData;
          this.alleventsData.sort((a, b) => a.event_element.date - b.event_element.date);
          }
        }

        
      },
    forceChange() {
    this.selectedStatus = "Reboot Democracy Lecture Series";
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
        fetchSeries: function fetchSeries() {
      self = this;

      this.directus
      .items('general_events_series')
      .readByQuery({
         meta: 'total_count',
         limit: -1,
         fields: [
          '*.*'
       ],
       
      })
      .then((item) => {
      self.seriesData =  item.data;

      });
    },
        fetchInnovateUS: function fetchInnovateUS() {
      self = this;

      this.directus
      .items('innovate_us_workshops')
      .readByQuery({

         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*',"instructor.innovate_us_instructors_id.*","instructor.innovate_us_instructors_id.headshot.*",
       ],
       
      })
      .then((item) => {

      let TempInnovateUSData =  item.data;
      let temp = TempInnovateUSData.map(element => ({ event_element: element, series_name: "InnovateUS Workshop" }));
       self.InnovateUSData = temp;
this.formatSeriesData();
      });

    },

    fetchEvents: function fetchEvents() {
      self = this;

      this.directus
      .items('reboot_democracy_resources')
      .readByQuery({
          filter: {
          type: 
          { 
            _eq: "Event"
           }
          },
         meta: 'total_count',
         limit: -1,
         sort:["-id"],
         fields: [
          '*.*','thumbnail.*','event_series.general_events_series_id.*'
       ],
       
      })
      .then((item) => {
      self.eventsData =  item.data;
      self.eventsData  = self.eventsData.map(element => ({ event_element: element, series_name: element.event_series[0].general_events_series_id.title }));
     this.formatSeriesData();
      });
    }

  }
}
</script>

<template>


 <!-- 
  This events page is driven by the following collections and is concatenated for the purpose of showing all events. If more event sources are added, this list should be udpated.
- All items tagged as event under Reboot Democracy 
- All InnovateUS Workshops  
-->


<!-- Header Component -->
<header-comp></header-comp>

<div class="events-hero">
  <div class="events-row">
    <h1>Events</h1>
    <div class="custom-select">
      <select v-model="selectedStatus" @change="formatSeriesData()">
        <option :value="undefined">All Events</option>
        <option v-for="series in seriesData" :value="series">{{series.title}}</option>
      </select>
      <i class="fa-solid fa-angle-down"></i>
    </div>
  </div>
   <div class="events-row">
    <div  v-if="eventTitle != ''" class="event-information">
      <h3 class="eyebrow" >{{eventTitle}}</h3>
      <h1>{{eventDescription}}</h1>
    </div>
  </div>
</div>

<div class="event-grid-section">
  <h3>Upcoming Events</h3>
  <div class="event-grid-row">
    <div class="event-grid-col"  v-for="event_item in alleventsData">
 
      <div class="event-grid-item">
        <div class="event-image">
            <img v-if="!event_item.event_element.instructor && event_item.event_element.thumbnail" :src="this.directus._url + 'assets/' + event_item.event_element.thumbnail.id">
            <div v-for="(instructor_item,index) in event_item.event_element.instructor" v-show="index < 1"> 
                <img :src="this.directus._url + 'assets/' + instructor_item.innovate_us_instructors_id.headshot.id">
            </div>

           
        </div>
        <div class="event-text">
          <h5 class="eyebrow">{{event_item.series_name}}</h5>
          <h2>{{event_item.event_element.title}}</h2>
          <p> {{ formatDateTime(new Date(event_item.event_element.date)) }} ET </p>

          <p v-html="event_item.event_element.description"></p>
          <a class="btn btn-primary btn-dark btn-medium">Register</a>
      </div>
    </div>
    </div>
  </div>
</div>

<div class="event-grid-section">
  <h3>Past Events</h3>
  <div class="past-event-grid-row">
    <div class="past-event-grid-item"  v-for="event_item in alleventsData" v-show="PastDate(new Date(event_item.event_element.date))">
      <div class="past-event-col-1">
          <h5 class="eyebrow">{{event_item.series_name}}</h5>
          <h2>{{event_item.event_element.title}}</h2>
      </div>
      <div class="past-event-col-2">
         <p v-html="event_item.event_element.description"></p>
         <a class="btn btn-secondary btn-dark btn-medium">Watch</a>
      </div>
    </div>
  </div>
</div>
<mailing-list-comp></mailing-list-comp>
<footer-comp></footer-comp>

</template>
