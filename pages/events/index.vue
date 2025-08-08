<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useAsyncData, useHead } from "#imports";
import { format, isPast, isFuture } from "date-fns";
import {
  fetchIndexData,
  fetchEventsData,
  fetchSeriesData,
} from "@/composables/fetchEvent";
import { getImageUrl } from "@/composables/useImageUrl.js";
import type { EventItem, GeneralEventsSeries } from "@/types/Event";
import { useSeoMeta } from "#imports";

const route = useRoute();
const iniLoad = ref(0);
const showingFullText = ref(true);

// Rest of your component code remains the same...
const { data: indexData } = await useAsyncData("reboot-index", fetchIndexData);
const { data: allEventsRaw } = await useAsyncData(
  "reboot-events",
  fetchEventsData
);
const { data: seriesData } = await useAsyncData(
  "reboot-series",
  fetchSeriesData
);

const eventsData = ref(allEventsRaw.value || []);
eventsData.value.sort(
  (a, b) =>
    new Date(a.event_element.date).getTime() -
    new Date(b.event_element.date).getTime()
);

const alleventsData = computed(() =>
  eventsData.value.filter((e) => {
    const firstSeries =
      e.event_element.event_series?.[0]?.general_events_series_id;
    return firstSeries?.title === "Reboot Democracy Lecture Series";
  })
);

const seriesInfo = computed(() =>
  (seriesData.value || []).find(
    (s) => s.title === "Reboot Democracy Lecture Series"
  )
);

const eventTitle = computed(() => seriesInfo.value?.title || "");
const eventDescription = computed(() => seriesInfo.value?.description || "");
const eventFullDescription = computed(
  () => seriesInfo.value?.full_description || ""
);

const accordionContent = computed(() => {
  if (showingFullText.value) return eventFullDescription.value;
  const lines = eventFullDescription.value?.split("\n") || [];
  return lines.slice(0, 2).join("\n");
});

const pageslug = ref(route.query);
const path = ref(route.fullPath);

const scrollMeTo = (refName: string) => {
  if (process.client) {
    const element = document.querySelector(`[ref="${refName}"]`) as HTMLElement;
    if (element) {
      const top = element.offsetTop - 80;
      window.scrollTo(0, top);
    }
  }
};

const formatDateTime = (d1: Date): string =>
  format(d1, "MMMM d, yyyy, h:mm aa");
const formatDateOnly = (d1: Date): string => format(d1, "MMMM d, yyyy");
const isPastDate = (d1: Date): boolean => isPast(d1);
const isFutureDate = (d1: Date): boolean => isFuture(new Date(d1));

useSeoMeta({
  title: 'Reboot Democracy Lecture Series',
  description: 'How can we leverage the power of artificial intelligence to reimagine democracy?',
  ogTitle: 'Reboot Democracy Lecture Series',
  ogDescription: 'How can we leverage the power of artificial intelligence to reimagine democracy?',
  ogImage: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3',
  ogType: 'website',
  ogUrl: 'https://rebootdemocracy.ai/events?Reboot%20Democracy%20Lecture%20Series',
  twitterTitle: 'Reboot Democracy Lecture Series',
  twitterDescription: 'How can we leverage the power of artificial intelligence to reimagine democracy?',
  twitterImage: 'https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3',
  twitterCard: 'summary_large_image'
});

</script>

<!-- Template remains exactly the same -->
<template>
  <div class="events-page">
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
                class="btn btn-primary btn-dark btn-medium register-btn"
                >Sign up to receive updates!</a
              >
            </div>
          </div>
          <div class="event-long-description">
            <div v-html="accordionContent"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="event-selection-row">
      <h2 class="event-selector Eactive" @click="scrollMeTo('upcoming')">
        Upcoming Events
      </h2>
      <h2 class="event-selector" @click="scrollMeTo('past-events')">
        Past Events
      </h2>
    </div>
    <div ref="upcoming" class="event-grid-section">
      <div class="event-grid-row">
        <div
          class="event-grid-col"
          v-for="event_item in eventsData"
          :key="event_item.event_element.id"
          v-show="isFutureDate(new Date(event_item.event_element.date))"
        >
          <div class="event-grid-item">
            <div class="event-grid-padding">
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
                    :src="getImageUrl(event_item.event_element.thumbnail)"
                  />
                  <div
                    v-for="(instructor_item, index) in event_item.event_element
                      .instructor"
                    v-show="index < 1"
                    :key="index"
                  >
                    <img
                      :src="
                        getImageUrl({
                          filename_disk:
                            instructor_item.innovate_us_instructors_id.headshot
                              ?.filename_disk,
                        })
                      "
                    />
                  </div>
                </div>
                <div class="event-text">
                  <div class="event-speakers">
                    <p v-if="event_item.event_element.speakers">
                      Speaker(s):&nbsp;
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
                    class="btn btn-primary btn-dark btn-medium register-btn"
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
                  v-if="event_item.event_element.partner_logo"
                  :src="getImageUrl(event_item.event_element.partner_logo)"
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
          :key="event_item.event_element.id"
          v-show="isPastDate(new Date(event_item.event_element.date))"
        >
          <div class="past-event-col-1">
            <div class="event-thumbnail">
              <img
                v-if="event_item.event_element.thumbnail"
                :src="getImageUrl(event_item.event_element.thumbnail)"
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
                :src="getImageUrl(event_item.event_element.partner_logo)"
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
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");

:root {
  font-size: 16px;
  --yellow-action: rgba(255, 180, 70, 1);
  --blue-text: rgba(0, 120, 156, 1);
  --blue-light: rgba(224, 248, 255, 1);
  --blue-rich: rgba(1, 42, 55, 1);
  --peach-action: rgba(247, 158, 130, 1);
}

/* Typography */
.events-page h1 {
  font-family: var(--font-habibi);
  font-size: 62.5px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -2.5px;
  margin: 0;
  padding: 0;
}

.events-page h2 {
  font-family: var(--font-habibi);
  margin: 0;
}

.events-page h3 {
  font-family: var(--font-habibi);
  font-size: 24px;
  margin: 0;
  margin: 0;
  padding: 0;
}

.events-page h5.eyebrow {
  width: fit-content;
  padding: 0.2em 0.5em;
  font-size: 0.7em;
}

.events-page p,
.events-page li {
  font-family: var(--font-habibi);
  font-weight: 500;
  margin: 0;
}

.events-page .eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-family: var(--font-habibi);
  letter-spacing: 2.4px;
}

/* Button Styles */
.events-page a.btn {
  font-size: 1rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-decoration: none;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  font-family: var(--font-habibi);
  color: #FFFFFF;
}

.events-page a.btn:hover {
  cursor: pointer;
}

.events-page .btn-primary {
  color: #ffffff;
  background: var(--yellow-action) !important;
  border: 1px solid #000000;
}

.events-page .register-btn {
  color: #ffffff;
  background: #fc6423 !important;
  height: 100% !important;
  margin-top: 20px !important;
}

.events-page .btn-dark {
  color: #FFFFFF !important;
}

.events-page .btn-secondary {
  color: #FFFFFF !important;
  background: #fc6423 !important;
  border: 1px solid #000000;
}

.events-page .btn-medium {
  width: fit-content;
  min-height: 42px;
  padding: 0 15px;
  height: 42px;
}

.events-page .btn-row {
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

/* Events Hero Section */
.events-hero {
  background: linear-gradient(90deg, #ffffff70, #ffffff70),
    url("/images/media-image.png");
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  background-repeat: no-repeat;
  background-size: cover;
  width: 100%;
  padding: 5rem 5rem 5rem 5rem;
  gap: 40px;
}

.events-hero h1 {
  font-family: var(--font-habibi);
}

.events-row {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 15rem;
}

.events-title-row {
  display: flex;
  flex-direction: column;
  justify-content: center !important;
  align-items: center !important;
  text-align: center;
  width: 100%;
}

h2.red-subtitle {
  color: #003366;
  font-weight: 500;
  text-transform: uppercase;
  line-height: 0.1em;
  margin: 20px 0 30px;
  font-size: 27px;
}

h2.red-subtitle span {
  padding: 0 2rem;
}

h2.red-subtitle span:before {
  border-top: 3px solid var(--blue-text);
  content: "";
  display: block;
  height: 1px;
  left: 200px;
  position: absolute;
  width: 320px;
  z-index: 0;
}

h2.red-subtitle span:after {
  border-bottom: 3px solid var(--blue-text);
  content: "";
  display: block;
  height: 1px;
  right: 200px;
  position: absolute;
  width: 320px;
  z-index: 0;
}

/* Event Information */
.event-information {
  background-color: #003366;
  color: #ffffff;
  padding: 4rem 4rem;
  width: 100%;
}

.event-information h1 {
  font-family: var(--font-habibi);
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  font-size: 40px;
}

.event-short-description {
  width: 100%;
  text-align: center;
  padding-bottom: 2rem;
  border-bottom: 2px solid #ffffff64;
}

.event-long-description {
  width: 100%;
  padding: 2rem 0;
}

.event-long-description div {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-long-description a {
  color: #ffffff;
}

/* Event Selection Navigation */
.event-selection-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: var(--blue-light);
  gap: 2rem;
  padding: 1rem 0;
  border-bottom: 1px solid #000000;
}

.event-selector:hover {
  cursor: pointer;
}

h2.event-selector {
  font-size: 1.2em;
  opacity: 50%;
}

h2.event-selector.Eactive {
  font-size: 1.4em;
  opacity: 100%;
  font-family: var(--font-habibi);
}

p.event-date {
  font-weight: 800 !important;
  padding-top: 10px;
}

/* Event Grid Section */
.event-grid-section {
  background-color: var(--blue-light);
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 40px;
  padding: 2em 5em 2rem 5rem;
  width: 100%;
}

.event-grid-row {
  display: flex;
  -webkit-flex-flow: row wrap;
  -ms-flex-flow: row wrap;
  flex-flow: row wrap;
  width: 100% !important;
  gap: 20px;
}

.event-grid-col {
  display: flex;
  flex-direction: column;
  -webkit-flex: 0 0 49%;
  -ms-flex: 0 0 49%;
  flex: 0 0 49%;
  max-width: 49%;
}

.event-grid-item {
  width: 100%;
  min-height: 400px;
  background-color: #ffffff;
  border: 1px solid #000000;
  display: flex;
  flex-direction: column;
}

.event-grid-item p {
  margin: 0;
}

.event-grid-item p.event-description {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
}

.event-speakers a {
  color: #000000;
  font-weight: 500 !important;
}

.event-speakersp strong {
  font-weight: 500 !important;
}

.event-speakers {
  display: flex;
  flex-direction: row;
  padding-top: 0px;
}

.event-grid-padding {
  padding: 1rem 2rem;
  border-bottom: 0px solid #000000;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
}

.event-tag-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 5px;
  height: 40px;
}

.event-partnership-container {
  display: flex;
  align-items: center;
}

.partnership-label {
  font-size: 1em;
  font-weight: 600;
  padding: 10px 0;
}

.event-thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-thumbnail img {
  width: 75%;
  height: 75%;
}
.past-event-col-2 p {
  margin: 0;
  padding: 0;
}
.event-description {
  padding: 10px 0;
  line-height: 1.5;
}

img.partner-logo-img {
  height: 100%;
  width: 50px;
  object-fit: contain;
  border-radius: 8px;
  margin: 5px 10px;
}

.partner-logo-section {
  display: flex;
  flex-direction: row;
  justify-content: flex-start !important;
  align-items: center !important;
  text-align: left !important;
  width: 50%;
  gap: 1rem;
  padding: 0 1rem;
}

.event-item-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 20px;
  flex-grow: 1;
}

.event-item-partnership-row > * {
  border: none;
}

.event-item-partnership-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 60px;
  padding: 10px;
}

.event-title {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.event-type {
  width: 25%;
  padding-top: 10px;
}

.event-image {
  width: 220px;
  flex-shrink: 0;
}

.event-image img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid #000000;
}

.event-text {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex-grow: 1;
  padding-top: 0;
}

/* Past Events Section */
.past-event-grid-row {
  width: 100%;
  height: fit-content;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.past-event-grid-item {
  border-top: 1px solid #000000;
  padding: 2rem 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: fit-content;
  gap: 4rem;
  width: 100%;
}

.past-event-col-1 {
  width: 20%;
  height: fit-content;
}

.past-event-col-2 {
  width: 80%;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .events-page h1 {
    font-size: 30px;
    font-family: var(--font-habibi);
  }

  h2.red-subtitle span:before {
    left: 100px;
    width: 60px;
  }

  h2.red-subtitle span:after {
    right: 100px;
    width: 60px;
  }

  .event-grid-item {
    height: auto;
  }

  .event-item-row {
    flex-direction: column;
    align-items: center !important;
    gap: 0;
    height: auto;
  }

  .event-title {
    height: auto;
  }

  .events-row {
    display: flex;
    padding: 0 1rem;
  }

  .event-information {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .event-short-description {
    width: 100%;
  }

  .event-long-description {
    width: 100%;
  }

  .events-hero {
    width: 100%;
    padding: 1rem;
    gap: 40px;
  }

  .events-hero h1 {
    font-family: var(--font-habibi);
  }

  .events-row {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .event-grid-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
    padding-left: 10px;
    padding-right: 10px;
    width: 100%;
  }

  .register-btn {
    color: #ffffff;
    background: var(--yellow-action) !important;
    height: 30% !important;
  }

  .event-grid-row {
    display: flex;
    -webkit-flex-flow: row wrap;
    -ms-flex-flow: row wrap;
    flex-flow: row wrap;
    width: 100% !important;
    justify-content: center !important;
  }

  .event-grid-col {
    display: flex;
    flex-direction: column;
    -webkit-flex: 0 0 95%;
    -ms-flex: 0 0 95%;
    flex: 0 0 95%;
    max-width: 100%;
  }

  .past-event-grid-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    height: fit-content;
    gap: 2rem;
  }

  .past-event-col-1 {
    width: 100%;
    height: fit-content;
  }

  .past-event-col-2 {
    width: 100%;
    height: fit-content;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .events-row {
    display: flex;
    padding: 0 5rem;
  }

  .event-grid-col {
    display: flex;
    flex-direction: column;
    -webkit-flex: 0 0 100%;
    -ms-flex: 0 0 100%;
    flex: 0 0 100%;
    max-width: 100%;
  }

  h2.red-subtitle span:before {
    left: 160px;
    width: 200px;
  }

  h2.red-subtitle span:after {
    right: 160px;
    width: 200px;
  }
}
</style>