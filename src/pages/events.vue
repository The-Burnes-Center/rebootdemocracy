<script lang="ts" setup>
/**
 * Imports
 */
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { createDirectus, rest, readItems } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import isFuture from 'date-fns/isFuture';
/* If needed:
import { useHead } from '@vueuse/head';
import { register } from 'swiper/element/bundle';
*/

// Components used in <template>
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import MailingListComponent from "../components/mailing.vue";

// Create refs for your sections:

/** Refs pointing to the container elements you want to scroll to */
const upcomingBlockRef = ref<HTMLElement | null>(null);
const pastEventsBlockRef = ref<HTMLElement | null>(null);

/**
 * Create Directus client
 */
const directus = createDirectus('https://content.thegovlab.com').with(rest());

/**
 * Access the current route
 */
const route = useRoute();

/**
 * Reactive state (converted from data())
 */
const iniLoad = ref<number>(0);
const showingFullText = ref<boolean>(true);
const accordionContent = ref<string>("");
const indexData = ref<any[]>([]);
const eventsData = ref<any[]>([]);
const InnovateUSData = ref<any[]>([]);   // declared but not used in your snippet
const selectedStatus = ref<any>(undefined);
const eventTitle = ref<string>("");
const eventDescription = ref<string>("");
const eventFullDescription = ref<string>("");
const seriesData = ref<any[]>([]);
const pageslug = ref<any>(route.query);
const alleventsData = ref<any[]>([]);
const path = ref<string>(route.fullPath);

/**
 * Lifecycle: onMounted
 * (replaces created() + mounted())
 */
onMounted(() => {
  fetchIndex();
  fetchEvents();
  fetchSeries();
  // If needed: fillMeta(); register();
});

/**
 * Watchers
 * Replaces 'updated()' and watch on $route
 */
watch(
  () => [showingFullText.value, eventFullDescription.value],
  () => {
    formattedBody();
  },
  { immediate: true }
);

watch(
  () => route.fullPath,
  () => {
    // If you had something to do on route change, put it here
  },
  { deep: true, immediate: true }
);

/**
 * Functions (replacing methods)
 */
function formatDateTime(d1: Date): string {
  return format(d1, "MMMM d, yyyy, h:mm aa");
}
function formatDateOnly(d1: Date): string {
  return format(d1, "MMMM d, yyyy");
}
function PastDate(d1: Date): boolean {
  return isPast(d1);
}
function FutureDate(d1: Date): boolean {
  return isFuture(new Date(d1));
}

function formattedBody(): void {
  if (showingFullText.value) {
    accordionContent.value = eventFullDescription.value;
  } else {
    if (eventFullDescription.value) {
      const lines = eventFullDescription.value.split("\n");
      const truncatedLines = lines.slice(0, 2);
      accordionContent.value = truncatedLines.join("\n");
    }
  }
}


function scrollMeTo(sectionName: 'upcoming' | 'pastEvents') {
  let el: HTMLElement | null = null;

  if (sectionName === 'upcoming') {
    el = upcomingBlockRef.value;
  } else if (sectionName === 'pastEvents') {
    el = pastEventsBlockRef.value;
  }

  if (el) {
    // Adjust -80 for your fixed header height, if needed
    const offsetTop = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth', 
    });
  }
}

function fetchIndex(): void {
  directus.request(
    readItems("reboot_democracy", {
      meta: "total_count",
      limit: -1,
      fields: ["*.*"]
    })
  )
  .then((response: any) => {
    indexData.value = response.data;
  })
  .catch((err: any) => console.error(err));
}

function fetchSeries(): void {
  directus.request(
    readItems("general_events_series", {
      meta: "total_count",
      limit: -1,
      fields: ["*.*"]
    })
  )
  .then((response: any) => {
    seriesData.value = response.data;
    // If there's an item at [1], set these fields:
    if (seriesData.value?.[1]) {
      eventTitle.value = seriesData.value[1].title;
      eventDescription.value = seriesData.value[1].description;
      eventFullDescription.value = seriesData.value[1].full_description;
    }
  })
  .catch((err: any) => console.error(err));
}

function fetchEvents(): void {
  directus.request(
    readItems("reboot_democracy_resources", {
      filter: { type: { _eq: "Event" } },
      meta: "total_count",
      limit: -1,
      sort: ["-date"],
      fields: [
        "*.*",
        "thumbnail.*",
        "partner_logo.*",
        "event_series.general_events_series_id.*"
      ]
    })
  )
  .then((response: any) => {
    // Add "series_name" property
    eventsData.value = response.map((element: any) => ({
      event_element: element,
      series_name: "Reboot Democracy Lecture Series"
    }));
    
    // Sort ascending by date
    eventsData.value.sort((b: any, a: any) => {
      return (
        new Date(b.event_element.date).getTime() -
        new Date(a.event_element.date).getTime()
      );
    });

    // Filter for Reboot Democracy Lecture Series
    const tempData = eventsData.value.filter((e: any) => {
      return (
        e.event_element.event_series?.length > 0 &&
        e.event_element.event_series[0].general_events_series_id?.title ===
        "Reboot Democracy Lecture Series"
      );
    });
    alleventsData.value = tempData;

    // Sort ascending by date
    alleventsData.value.sort((b: any, a: any) => {
      return (
        new Date(b.event_element.date).getTime() -
        new Date(a.event_element.date).getTime()
      );
    });

    // If you had additional logic (e.g. formatSeriesData()), call it here
  })
  .catch((err: any) => console.error(err));
}
/** 
 * Example meta injection
 * function fillMeta() {
 *   useHead({ ... });
 * }
 */

/** 
 * You can also import and register components in <script setup> style:
 * e.g. 
 * const components = {
 *   HeaderComponent,
 *   FooterComponent,
 *   MailingListComponent
 * }
 * But in <script setup>, you usually just import and then use them in template.
 */
</script>

<template>
  <!-- 
    Here is your original template 
    (unchanged except for removing "this." in front of references)
  -->
  <!-- Header Component -->
  <HeaderComponent></HeaderComponent>

  <div class="events-hero">
    <div class="events-title-row">
      <div class="events-title-col">
        <h1>Rebooting Democracy in the Age of AI</h1>
        <h2 class="red-subtitle"><span>Lecture Series</span></h2>
      </div>
    </div>
    <div class="events-row">
      <div v-if="eventTitle !== ''" class="event-information">
        <div class="event-short-description">
          <h1>{{ eventDescription }}</h1>
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
          <!-- 
          <a class="btn btn-ghost btn-peach-light" @click="showingFullText = !showingFullText">
            {{ showingFullText ? "Less" : "More" }} about this event series
            <i
              class="fa-solid"
              :class="{ 'fa-chevron-up': showingFullText, 'fa-chevron-down': !showingFullText }"
            ></i>
          </a>
          -->
        </div>
      </div>
    </div>
  </div>

  <div class="event-selection-row">
    <h2 class="event-selector active" @click="scrollMeTo('upcoming')">
      Upcoming Events
    </h2>
    <h2 class="event-selector" @click="scrollMeTo('pastEvents')">
      Past Events
    </h2>
  </div>

  <div ref="upcomingBlockRef" class="event-grid-section">
    <div class="event-grid-row">
      <div
        class="event-grid-col"
        v-for="event_item in eventsData"
        :key="event_item.event_element.id"
        v-show="FutureDate(new Date(event_item.event_element.date))"
      >
        <div class="event-grid-item">
          <div class="event-grid-padding">
            <div class="event-title">
              <h3>{{ event_item.event_element.title }}</h3>
            </div>
            <div class="event-item-row">
              <div class="event-image">
                <!-- If no instructor but has thumbnail -->
                <img
                  v-if="!event_item.event_element.instructor && event_item.event_element.thumbnail"
                  :src="
                    directus.url.href + 'assets/' + event_item.event_element.thumbnail.id
                  "
                />
                <!-- If has instructor: show first instructor headshot -->
                <div
                  v-for="(instructor_item, index) in event_item.event_element.instructor"
                  :key="index"
                  v-show="index < 1"
                >
                  <img
                    :src="
                      directus.url.href + 'assets/' + 
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
                  {{ formatDateTime(new Date(event_item.event_element.date)) }} ET
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

          <!-- Partner logo -->
          <div
            class="event-item-partnership-row"
            v-if="event_item.event_element.partner_logo"
          >
            <div class="partner-logo-section">
              <p class="partnership-label">In Partnership with:</p>
              <img
                class="partner-logo-img"
                :src="
                  directus.url.href + 'assets/' + event_item.event_element.partner_logo.id
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div ref="pastEventsBlockRef" class="event-grid-section">
    <h3>Past Events</h3>
    <div class="past-event-grid-row">
      <div
        class="past-event-grid-item"
        v-for="event_item in eventsData.slice().reverse()"
        :key="event_item.event_element.id + '_past'"
        v-show="PastDate(new Date(event_item.event_element.date))"
      >
        <div class="past-event-col-1">
          <div class="event-thumbnail">
            <img
              v-if="event_item.event_element.thumbnail"
              :src="
                directus.url.href + 'assets/' + event_item.event_element.thumbnail.id
              "
            />
          </div>
        </div>
        <div class="past-event-col-2">
          <h5 class="eyebrow">{{ event_item.series_name }}</h5>
          <h2>{{ event_item.event_element.title }}</h2>
          <p>{{ formatDateTime(new Date(event_item.event_element.date)) }} ET</p>
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
                directus.url.href + 'assets/' + event_item.event_element.partner_logo.id
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

  <FooterComponent></FooterComponent>
</template>

<style scoped>
/* Your styles here, if any */
</style>
