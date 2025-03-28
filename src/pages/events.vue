
<script>
import { ref, watch } from "vue";
import { Directus } from "@directus/sdk";
import format from "date-fns/format";
import isPast from "date-fns/isPast";
import isFuture from "date-fns/isFuture";
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
      accordionContent: "",
      indexData: [],
      eventsData: [],
      InnovateUSData: [],
      selectedStatus: undefined,
      eventTitle: "",
      eventDescription: "",
      eventFullDescription: "",
      seriesData: [],
      pageslug: this.$route.query,
      alleventsData: [],
      directus: new Directus("https://dev.thegovlab.com/"),
      path: this.$route.fullPath,
    };
  },

  created() {
    this.indexData = this.directus.items("reboot_democracy");
    this.fetchIndex();
    this.fetchEvents();
    // this.fetchInnovateUS();
    this.fetchSeries();
  },
  updated() {
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
    fillMeta() {
      useHead({
        title: "InnovateUS",
        meta: [
          { name: "title", content: "Reboot Democracy Lecture Series" },
          { property: "og:title", content: "Reboot Democracy Lecture Series" },
          {
            property: "og:description",
            content:
              "How can we leverage the power of artificial intelligence to reimagine democracy?",
          },
          {
            property: "og:image",
            content: "https://rebootdemocracy.ai/meta-temp.png",
          },
          {
            property: "twitter:title",
            content: "Reboot Democracy Lecture Series",
          },
          {
            property: "twitter:description",
            content:
              "How can we leverage the power of artificial intelligence to reimagine democracy?",
          },
          {
            property: "twitter:image",
            content: "https://rebootdemocracy.ai/meta-temp.png",
          },
          { property: "twitter:card", content: "summary_large_image" },
        ],
      });
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
    FutureDate: function FutureDate(d1) {
      return isFuture(new Date(d1));
    },
    formattedBody() {
      if (this.showingFullText) {
        this.accordionContent = this.eventFullDescription;
      } else {
        if (this.eventFullDescription) {
          const lines = this.eventFullDescription.split("\n");
          const truncatedLines = lines.slice(0, 2);

          const truncatedText = truncatedLines.join("\n");

          this.accordionContent = truncatedText;
        }
      }
    },

    scrollMeTo(refName) {
      var element = this.$refs[refName];
      var top = element.offsetTop - 80;
      window.scrollTo(0, top);
    },

    fetchIndex: function fetchIndex() {
      self = this;

      this.directus
        .items("reboot_democracy")
        .readByQuery({
          meta: "total_count",
          limit: -1,
          fields: ["*.*"],
        })
        .then((item) => {
          self.indexData = item.data;
        });
    },
    fetchSeries: function fetchSeries() {
      self = this;

      this.directus
        .items("general_events_series")
        .readByQuery({
          meta: "total_count",
          limit: -1,
          fields: ["*.*"],
        })
        .then((item) => {
          self.seriesData = item.data;
          self.eventTitle = self.seriesData[1].title;
          self.eventDescription = self.seriesData[1].description;
          self.eventFullDescription = self.seriesData[1].full_description;
        });
    },

    fetchEvents: function fetchEvents() {
      self = this;

      this.directus
        .items("reboot_democracy_resources")
        .readByQuery({
          filter: {
            type: {
              _eq: "Event",
            },
          },
          meta: "total_count",
          limit: -1,
          sort: ["-date"],
          fields: [
            "*.*",
            "thumbnail.*",
            "partner_logo.*",
            "event_series.general_events_series_id.*",
          ],
        })
        .then((item) => {
          self.eventsData = item.data;
          self.eventsData = self.eventsData.map((element) => ({
            event_element: element,
            series_name: "Reboot Democracy Lecture Series",
          }));
          self.eventsData.sort(
            (b, a) =>
              new Date(b.event_element.date) - new Date(a.event_element.date)
          );
          console.log(this.eventsData);
          let tempData = this.eventsData.filter(function (e) {
            return (
              e.event_element.event_series[0].general_events_series_id.title ==
              "Reboot Democracy Lecture Series"
            );
          });
          this.alleventsData = tempData;
          this.alleventsData.sort(
            (b, a) =>
              new Date(b.event_element.date) - new Date(a.event_element.date)
          );

          this.formatSeriesData();
        });
    },
  },
};
</script>

<template>
  <!-- Header Component -->
  <header-comp></header-comp>

  <div class="events-hero">
    <div class="events-title-row">
      <div class="events-title-col">
        <h1>Rebooting Democracy in the Age of AI</h1>
        <h2 class="red-subtitle"><span>Lecture Series</span></h2>
      </div>
    </div>
    <div class="events-row">
      <div v-if="eventTitle != ''" class="event-information">
        <div class="event-short-description">
          <h1>{{ eventDescription }}</h1>
          <!-- <a @click="scrollMeTo('past-events')" class="mt-10 btn btn-primary btn-dark btn-medium">View Past Lectures</a> -->
          <div class="btn-row">
            <a
              href="/signup"
              target="_blank"
              class="mt-10 btn btn-primary btn-dark btn-medium"
              >Sign up to receive updates!</a
            >
          </div>
        </div>
        <div class="event-long-description">
          <div v-html="accordionContent"></div>
          <!-- <a class="btn btn-ghost btn-peach-light" @click="showingFullText = !showingFullText">{{ showingFullText ? "Less" : "More" }} about this event series  <i class="fa-solid" :class="{ 'fa-chevron-up': showingFullText, 'fa-chevron-down': !showingFullText}"></i></a> -->
        </div>
      </div>
    </div>
  </div>

  <div class="event-selection-row">
    <h2 class="event-selector active" @click="scrollMeTo('upcoming')">
      Upcoming Events
    </h2>
    <h2 class="event-selector" @click="scrollMeTo('past-events')">
      Past Events
    </h2>
  </div>
  <!-- <mailing-list-comp></mailing-list-comp> -->
  <div ref="upcoming" class="event-grid-section">
    <div class="event-grid-row">
      <div
        class="event-grid-col"
        v-for="event_item in eventsData"
        v-show="FutureDate(new Date(event_item.event_element.date))"
      >
        <div class="event-grid-item">
          <div class="event-grid-padding">
            <!-- <div class="event-tag-row">
            <div class="dot"></div>
            <p>Innovation Mindset</p>
          </div> -->

            <div class="event-title">
              <h3>{{ event_item.event_element.title }}</h3>
            </div>
            <div class="event-item-row">
              <div class="event-image">
                <img
                  v-if="
                    !event_item.event_element.instructor &&
                    event_item.event_element.thumbnail
                  "
                  :src="
                    this.directus._url +
                    'assets/' +
                    event_item.event_element.thumbnail.id
                  "
                />
                <div
                  v-for="(instructor_item, index) in event_item.event_element
                    .instructor"
                  v-show="index < 1"
                >
                  <img
                    :src="
                      this.directus._url +
                      'assets/' +
                      instructor_item.innovate_us_instructors_id.headshot.id
                    "
                  />
                </div>
              </div>

              <div class="event-text">
                <div class="event-speakers">
                  <p v-if="event_item.event_element.speakers">
                    Speaker(s):&nbsp
                  </p>
                  <div v-html="event_item.event_element.speakers"></div>
                </div>
                <p
                  class="event-description"
                  v-html="event_item.event_element.description"
                ></p>
                <p
                  class="event-type"
                  v-if="
                    event_item.event_element.online_event &&
                    !event_item.event_element.inperson_event
                  "
                >
                  <i class="fa-solid fa-video"></i> Online
                </p>
                <p
                  class="event-type"
                  v-if="event_item.event_element.inperson_event"
                >
                  <i class="fa-solid fa-building-user"></i> Hybrid
                </p>
                <p class="event-date">
                  {{
                    formatDateTime(new Date(event_item.event_element.date))
                  }}
                  ET
                </p>
                <a
                  :href="event_item.event_element.link"
                  target="_blank"
                  class="btn register-btn btn-dark btn-medium register-btn"
                  >Register</a
                >
              </div>
            </div>
          </div>
          <div
            class="event-item-partnership-row"
            v-if="event_item.event_element.partner_logo"
          >
            <div class="partner-logo-section">
              <p class="partnership-label">In Partnership with:</p>
              <img
                class="partner-logo-img"
                :src="
                  this.directus._url +
                  'assets/' +
                  event_item.event_element.partner_logo.id
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div ref="past-events" class="event-grid-section">
    <h3>Past Events</h3>
    <div class="past-event-grid-row">
      <div
        class="past-event-grid-item"
        v-for="event_item in eventsData.slice().reverse()"
        v-show="PastDate(new Date(event_item.event_element.date))"
      >
        <div class="past-event-col-1">
          <div class="event-thumbnail">
            <img
              v-if="event_item.event_element.thumbnail"
              :src="
                this.directus._url +
                'assets/' +
                event_item.event_element.thumbnail.id
              "
            />
          </div>
        </div>
        <div class="past-event-col-2">
          <h5 class="eyebrow">{{ event_item.series_name }}</h5>
          <h2>{{ event_item.event_element.title }}</h2>

          <p>
            {{ formatDateTime(new Date(event_item.event_element.date)) }} ET
          </p>
          <div class="event-partnership-container">
            <p
              class="partnership-label"
              v-if="event_item.event_element.partner_logo"
            >
              In Partnership with:
            </p>
            <img
              class="partner-logo-img"
              v-if="event_item.event_element.partner_logo"
              :src="
                this.directus._url +
                'assets/' +
                event_item.event_element.partner_logo.id
              "
            />
          </div>
          <p
            class="event-description"
            v-html="event_item.event_element.description"
          ></p>
          <a
            :href="event_item.event_element.link"
            target="_blank"
            class="btn btn-secondary btn-dark btn-medium"
            >Watch</a
          >
        </div>
      </div>
    </div>
  </div>

  <footer-comp></footer-comp>
</template>
