
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
      iniLoad: 0,  
      showingFullText: true,  
      accordionContent: '',             
      indexData: [],
      eventsData:[],
      InnovateUSData:[],
      selectedStatus: undefined,
      eventTitle: "",
      eventDescription: "",
      eventFullDescription: "",
      seriesData:[],
      pageslug: this.$route.query,
      alleventsData: [],
      directus: new Directus('https://content.thegovlab.com/'),
      path:this.$route.fullPath,
    }
  },

  created() {

    this.indexData = this.directus.items("reboot_democracy");
    this.fetchIndex();
    this.fetchEvents();
    // this.fetchInnovateUS();
    this.fetchSeries(); 
    
   
  },
    updated () {
     this.formattedBody();
    //   this.$nextTick(() => {
    //   if(this.pageslug && this.iniLoad == 0){
    //     this.iniLoad = 1;
    //     const queryString = Object.keys(this.$route.query).map(key => `${encodeURIComponent(key)}`).join('&').replace(/%20/g, ' ');
    //     let tempData = this.seriesData.filter(function (e) {
    //       console.log("Comparing " + e.title + " with " + queryString);
    //       return e.title == queryString;
    //     });
    //     console.log(tempData);
    //     this.selectedStatus = tempData[0];
        
    // }
    // console.log(this.selectedStatus);
    //     });
  },


  methods: {


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
   formattedBody() {
      if (this.showingFullText) {
        this.accordionContent = this.eventFullDescription;
      }
    else {
      if(this.eventFullDescription){

          const lines = this.eventFullDescription.split('\n');
          const truncatedLines = lines.slice(0, 2);

          const truncatedText = truncatedLines.join('\n');

         this.accordionContent  = truncatedText;
      }
    }
     
    },
      // formatSeriesData: async function formatSeriesData() {

      //    self = this;

      //   if(self.selectedStatus == undefined) {
      //     self.eventTitle = "";
      //     self.eventDescription = "";
      //     self.eventFullDescription = "";
      //     this.alleventsData = this.eventsData.concat(this.InnovateUSData);
      //    this.alleventsData.sort((b, a) => new Date(b.event_element.date) - new Date(a.event_element.date))
          
      //   }
      //   else if (self.selectedStatus != undefined){
      //     self.eventTitle = self.selectedStatus.title;
      //     self.eventDescription = self.selectedStatus.description;
      //     self.eventFullDescription = self.selectedStatus.full_description;

      //     if(self.selectedStatus.title == "InnovateUS Workshops"){
       
      //       //  this.InnovateUSData_elements = this.InnovateUSData.map(obj => obj.event_element);
      //       this.alleventsData = this.InnovateUSData;
      //       this.alleventsData.sort((b, a) => new Date(b.event_element.date) - new Date(a.event_element.date))
      //     }

      //     else if(self.selectedStatus.title != "InnovateUS Workshops"){

      //     // this.eventsData_elements = this.eventsData.map(obj => obj.event_element);
      //     let tempData = this.eventsData.filter(function (e) {
      //     return e.event_element.event_series[0].general_events_series_id.title == self.selectedStatus.title
      //   });
      //     this.alleventsData = tempData;
      //     this.alleventsData.sort((b, a) => new Date(b.event_element.date) - new Date(a.event_element.date))
      //     }
      //   }

        
      // },

       scrollMeTo(refName) {

    var element = this.$refs[refName];
    var top = element.offsetTop - 80;
    window.scrollTo(0, top);
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
          self.eventTitle = self.seriesData[1].title;
          self.eventDescription = self.seriesData[1].description;
          self.eventFullDescription = self.seriesData[1].full_description;

      });
    },
//         fetchInnovateUS: function fetchInnovateUS() {
//       self = this;

//       this.directus
//       .items('innovate_us_workshops')
//       .readByQuery({

//          meta: 'total_count',
//          limit: -1,
//          sort:["-id"],
//          fields: [
//           '*.*',"instructor.innovate_us_instructors_id.*","instructor.innovate_us_instructors_id.headshot.*",
//        ],
       
//       })
//       .then((item) => {

//       let TempInnovateUSData =  item.data;
//       let temp = TempInnovateUSData.map(element => ({ event_element: element, series_name: "InnovateUS Workshop" }));
//        self.InnovateUSData = temp;
// this.formatSeriesData();
//       });

//     },

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
         sort:["-date"],
         fields: [
          '*.*','thumbnail.*','partner_logo.*','event_series.general_events_series_id.*'
       ],
       
      })
      .then((item) => {
      self.eventsData =  item.data;
      self.eventsData  = self.eventsData.map(element => ({ event_element: element, series_name: "Reboot Democracy Lecture Series" }));
      self.eventsData.sort((b, a) => new Date(b.event_element.date) - new Date(a.event_element.date))
      console.log(this.eventsData);
          let tempData = this.eventsData.filter(function (e) {
          return e.event_element.event_series[0].general_events_series_id.title == "Reboot Democracy Lecture Series"
          });
           this.alleventsData = tempData;
         this.alleventsData.sort((b, a) => new Date(b.event_element.date) - new Date(a.event_element.date))

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
    <!-- <div class="custom-select">
      <select v-model="selectedStatus" @change="formatSeriesData()">
        <option :value="undefined">All Events</option>
        <option v-for="series in seriesData" :value="series">{{series.title}}</option>
      </select>
      <i class="fa-solid fa-angle-down"></i>
    </div> -->
  </div>
   <div class="events-row">
    <div  v-if="eventTitle != ''" class="event-information">
      <div class="event-short-description">
        <h3 class="eyebrow" >{{eventTitle}}</h3>
        <h1>{{eventDescription}}</h1>
         <a @click="scrollMeTo('past-events')" class="mt-10 btn btn-primary btn-dark btn-medium">View Past Lectures</a>
      </div>
      <div class="event-long-description">
        <div v-html="accordionContent"></div>
        <!-- <a class="btn btn-ghost btn-peach-light" @click="showingFullText = !showingFullText">{{ showingFullText ? "Less" : "More" }} about this event series  <i class="fa-solid" :class="{ 'fa-chevron-up': showingFullText, 'fa-chevron-down': !showingFullText}"></i></a> -->
      </div>
      <!-- <div class="btn-grp">
        <a  @click="scrollMeTo('about')" class="btn btn-primary btn-dark btn-medium">Learn More</a>
        <a  @click="scrollMeTo('past-events')" class="btn btn-primary btn-dark btn-medium">Watch Past Events</a>
      </div> -->
    </div>
  </div>
</div>



<div ref="upcoming" class="event-grid-section">
  <h3>Upcoming Events</h3>
  <div class="event-grid-row">
    <div class="event-grid-col"  v-for="event_item in eventsData" v-show="FutureDate(new Date(event_item.event_element.date))">
     <!-- <div class="event-grid-col"  v-for="event_item in alleventsData"> -->
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
          <p class="event-description" v-html="event_item.event_element.speakers"></p>
          <p class="event-description" v-if="event_item.event_element.online_event"><i class="fa-solid fa-video"></i> Virtual Event</p>
          <p class="event-description" v-if="event_item.event_element.inperson_event"><i class="fa-solid fa-building-user"></i>In-person Event</p>
          <p class="event-description" v-html="event_item.event_element.description"></p>
          <div class="partner-logo-section">
            <p class="partnership-label" v-if="event_item.event_element.partner_logo">In Partnership with:</p>
           <img class="partner-logo-img" v-if="event_item.event_element.partner_logo" :src="this.directus._url + 'assets/' + event_item.event_element.partner_logo.id">
          </div>
          <a :href="event_item.event_element.link" target="_blank" class="btn btn-primary btn-dark btn-medium">Register</a>
      </div>
    </div>
    </div>
  </div>
</div>

<div ref="past-events" class="event-grid-section">
  <h3>Past Events</h3>
  <div class="past-event-grid-row">
    <div class="past-event-grid-item"  v-for="event_item in eventsData.slice().reverse()" v-show="PastDate(new Date(event_item.event_element.date))">
      <div class="past-event-col-1">
          <h5 class="eyebrow">{{event_item.series_name}}</h5>
          <h2>{{event_item.event_element.title}}</h2>
          
           <p> {{ formatDateTime(new Date(event_item.event_element.date)) }} ET </p>
           <p class="partnership-label" v-if="event_item.event_element.partner_logo">In Partnership with:</p>
           <img class="partner-logo-img" v-if="event_item.event_element.partner_logo" :src="this.directus._url + 'assets/' + event_item.event_element.partner_logo.id">
      </div>
      <div class="past-event-col-2">
         <p v-html="event_item.event_element.description"></p>
         <a  :href="event_item.event_element.link" target="_blank"  class="btn btn-secondary btn-dark btn-medium">Watch</a>
      </div>
    </div>
  </div>
</div>


<mailing-list-comp></mailing-list-comp>
<footer-comp></footer-comp>

</template>
