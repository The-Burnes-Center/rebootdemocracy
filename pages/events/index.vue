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
const activeSection = ref('upcoming');

// Rest of your component code remains the same...
const { data: indexData } = await useAsyncData("reboot-index", fetchIndexData);
const { data: allEventsRaw } = await useAsyncData(
  "reboot-events",
  fetchEventsData
);
const { data: workshopsData } = await useAsyncData(
  "reboot-workshops",
  fetchUpcomingWorkshops
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

const scrollToSection = (sectionId: string) => {
  if (process.client) {
    const element = document.getElementById(sectionId);
    if (element) {
      const top = element.offsetTop - 100; // Adjust offset for header
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
      activeSection.value = sectionId;
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
      <h2 class="event-selector" :class="{ 'Eactive': activeSection === 'upcoming' }" @click="scrollToSection('upcoming')">
        Upcoming Workshops
      </h2>
      <h2 class="event-selector" :class="{ 'Eactive': activeSection === 'past-events' }" @click="scrollToSection('past-events')">
        Past Events
      </h2>
    </div>
    <div ref="upcoming" class="event-grid-section">
      <h3 id="upcoming">Upcoming Workshops</h3>

      <div class="event-grid-row">        <div
          class="event-grid-col"
          v-for="event_item in workshopsData"
          :key="event_item.id"
          v-show="isFutureDate(new Date(event_item.date))"
        >
          <div class="workshop-card">
            <div class="workshop-card-header">
              <p class="workshop-date"><span class="material-symbols-outlined">event</span>{{ formatDateTime(new Date(event_item.date)) }} ET</p>
            </div>
            <div class="workshop-card-content">
              <h3>{{ event_item.title }}</h3>
              <div
                class="event-description"
                v-html="event_item.description"
              ></div>
              <div class="event-speakers" v-if="event_item.instructor && event_item.instructor.length > 0">
                <span>Instructor(s):&nbsp;</span>
                <div>
                  <span v-for="(instructor, index) in event_item.instructor" :key="instructor.innovate_us_instructors_id.name">
                    {{ instructor.innovate_us_instructors_id.name }}
                    <span v-if="index < event_item.instructor.length - 1">, </span>
                  </span>
                </div>
              </div>
              <a
                v-if="event_item.sign_up_link"
                :href="event_item.sign_up_link"
                target="_blank"
                class="btn btn-primary btn-dark btn-medium register-btn"
              >REGISTER NOW</a>
            </div>
          </div>
        </div>
      </div>
      <div class="view-more-container">
        <a 
          href="https://innovate-us.org/workshops?series=Democratic+Engagement"
          target="_blank"
          class="view-more-btn"
        >
           VIEW MORE WORKSHOPS
        </a>
      </div>
    </div>
    <div class="event-grid-section">
      <h3 id="past-events">Past Events</h3>
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
              >WATCH</a
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
  font-family: var(--font-sora);
  font-size: 62.5px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -2.5px;
  margin: 0;
  padding: 0;
}

.events-page h2 {
  font-family: var(--font-sora);
  margin: 0;
}

.events-page h3 {
  font-family: var(--font-sora);
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
.event-long-description p{
  font-size: 20px !important;
}
.events-page p,
.events-page li {
  font-family: var(--font-habibi);
  font-weight: 500;
  margin: 0;
  font-size: 1rem;
  line-height: 25px;
}

.events-page .eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-family: var(--font-sora);
  letter-spacing: 2.4px;
}

/* Button Styles */
.events-page a.btn {
  font-size: 1rem;
  margin: 0;
  font-weight: 700;
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
  background: #003366 !important;
  height: auto !important;
  margin-top: 1rem !important;
  padding: 0.5rem 0.5rem !important;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem !important;
  border: none !important;
}

.register-btn:hover {
  background: #004480 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.view-more-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.view-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background-color: #003366;
  color: #ffffff;
  font-family: var(--font-habibi);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 6px;
  border: 1px solid rgba(0, 51, 102, 0.1);
  box-shadow: 0 1px 2px rgba(0, 51, 102, 0.05);
  transition: all 0.2s ease;
}

.view-more-btn:hover {
  background: linear-gradient(135deg, #f0f5ff 0%, #f5f8ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 51, 102, 0.1);
}

@media (max-width: 768px) {
  .view-more-btn {
    width: 100%;
    padding: 0.75rem 1rem;
  }
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
  font-family: var(--font-sora);
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
  background: linear-gradient(135deg, #e6efff 0%, #e6efff 100%);
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
  font-size: 1.2em;
  opacity: 100%;
  font-family: var(--font-sora);
}

p.event-date {
  font-weight: 800 !important;
  padding-top: 10px;
}

/* Event Grid Section */
.event-grid-section {
  background: linear-gradient(135deg, #e6efff 0%, #e6efff 100%);
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
  margin: 0 -0.75rem;
}

.event-grid-col {
  display: flex;
  flex-direction: column;
  -webkit-flex: 0 0 33.333%;
  -ms-flex: 0 0 33.333%;
  flex: 0 0 33.333%;
  max-width: 33.333%;
  padding: 0 0.75rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1200px) {
  .event-grid-col {
    -webkit-flex: 0 0 50%;
    -ms-flex: 0 0 50%;
    flex: 0 0 50%;
    max-width: 50%;
  }
}

@media (max-width: 768px) {
  .event-grid-col {
    -webkit-flex: 0 0 100%;
    -ms-flex: 0 0 100%;
    flex: 0 0 100%;
    max-width: 100%;
    padding: 0;
  }
}

.workshop-accordion {
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 51, 102, 0.05);
  margin-bottom: 1rem;
  overflow: hidden;
}

.workshop-header {
  padding: 1rem 1.5rem;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.2s ease;
  border-bottom: 1px solid #e6efff;
}

@media (max-width: 768px) {
  .workshop-header {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }
}

.workshop-header:hover {
  background: #fafbff;
}

.workshop-header.is-active {
  background: #fafbff;
}

.workshop-header-left {
  flex: 1;
  min-width: 0;
}

.workshop-header-left h3 {
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .workshop-header-left {
    width: 100%;
  }
  
  .workshop-header-left h3 {
    font-size: 1.125rem;
    text-wrap: wrap;

  }
}



.workshop-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .event-selection-row{
    gap:1rem;
    padding:0.5rem;
  }
  .workshop-header-right {
    width: 100%;
    gap:0.2rem;
    justify-content: space-between;
  }
}

.accordion-arrow {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  color: #666;
}

.accordion-arrow.is-expanded {
  transform: rotate(180deg);
}

.workshop-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.workshop-content.is-expanded {
  max-height: 1000px;
}

.workshop-content-inner {
  padding: 1.5rem;
  background: #fafbff;
}

@media (max-width: 768px) {
  .workshop-content-inner {
    padding: 1rem;
  }
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

.event-speakers p strong {
  font-weight: 500 !important;
  font-family: var(--font-sora) !important;
}

.event-speakers {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0.75rem 0;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 51, 102, 0.1);
  font-family: var(--font-sora) !important;
  font-weight: 500 !important;
}

.event-speakers p {
  font-weight: 600;
  color: #003366;
  margin: 0;
  font-size: 1rem;
}

.event-speakers div {
  color: #003366 !important;
  line-height: 1.4;
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: calc(0.95rem * 1.4 * 2);
}

.event-grid-padding {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 1rem;
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
  font-size: 0.875rem;
  line-height: 1.5;
  color: #444;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: calc(1rem * 1.5 * 4);
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
  width: 100%;
  line-height: 1.5;
}

.event-title h3 {
  font-size: 1.25rem;
  margin: 0;
  line-height: 1.3;
}

.workshop-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.workshop-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 51, 102, 0.05);
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 51, 102, 0.1);
}

.workshop-card:hover {
  box-shadow: 0 4px 8px rgba(0, 51, 102, 0.1);
}

.workshop-card-header {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fafbff 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(0, 51, 102, 0.1);
}

.workshop-card-content {
  padding: 1rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  padding-bottom: 4.5rem;
}

.workshop-card-content h3 {
  font-size: 1.125rem;
  line-height: 1.4;
  color: #003366;
  margin: 0;
  font-family: var(--font-sora);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: calc(1.125rem * 1.4 * 2);
}

.event-description {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #444;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: calc(1rem * 1.5 * 4);
}

.event-speakers {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: var(--font-sora) !important;
  font-weight: 500 !important;
  margin: 0;
}

.event-speakers p {
  font-weight: 600;
  color: #003366;
  margin: 0;
  font-size: 1rem;
}

.event-speakers div {
  color: #003366 !important;
  line-height: 1.4;
  font-size: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: calc(1rem * 1.4 * 2);
}

.register-btn {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  margin: 0 !important;
  margin-top: 1rem !important;
}

@media (max-width: 768px) {
  .workshop-card-header {
    padding: 0.75rem;
  }

  .workshop-card-content {
    padding: 0.75rem;
    padding-bottom: 5rem;
  }
}


.workshop-date {
  color: #003366;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-sora) !important;
  font-weight: 700 !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 4px;
  width: fit-content;
  line-height: 1.4;
}


.workshop-date .material-symbols-outlined {
  font-size: 20px;
  color: #003366;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
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

  .workshop-date{
    padding: 0rem;
  }
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
  .event-type{
    width: 50%;
  }

  .event-item-row {
    flex-direction: column;
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
    align-items: center;
    gap: 40px;
    padding-left: 20px;
    padding-right: 20px;
  }
.event-information{
  padding: 1rem;
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