<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import { format, isPast, isFuture } from "date-fns";
import { useRoute } from "vue-router";
import type { Event, EventItem, GeneralEventsSeries } from "../types/Event";
import {
  fetchEventsData,
  fetchIndexData,
  fetchSeriesData,
} from "~/composables/fetchEvent";

export default defineComponent({
  components: {},

  setup() {
    const route = useRoute();
    const iniLoad = ref(0);
    const showingFullText = ref(true);
    const accordionContent = ref("");
    const indexData = ref<any[]>([]);
    const eventsData = ref<EventItem[]>([]);
    const InnovateUSData = ref<any[]>([]);
    const selectedStatus = ref<GeneralEventsSeries | undefined>(undefined);
    const eventTitle = ref("");
    const eventDescription = ref("");
    const eventFullDescription = ref("");
    const seriesData = ref<GeneralEventsSeries[]>([]);
    const pageslug = ref(route.query);
    const alleventsData = ref<EventItem[]>([]);
    const path = ref(route.fullPath);

    const fetchData = async () => {
      try {
        indexData.value = await fetchIndexData();
        const events = await fetchEventsData();
        eventsData.value = events;

        // Sort events by date
        eventsData.value.sort(
          (b, a) =>
            new Date(b.event_element.date).getTime() -
            new Date(a.event_element.date).getTime()
        );

        // Filter events by series - with safe property access
        const tempData = eventsData.value.filter((e) => {
          // Make sure the event has event_series and it's not empty
          if (
            !e.event_element.event_series ||
            e.event_element.event_series.length === 0
          ) {
            return false;
          }

          // Make sure event_series[0] has general_events_series_id
          const firstSeries = e.event_element.event_series[0];
          if (!firstSeries.general_events_series_id) {
            return false;
          }

          // Check the title
          return (
            firstSeries.general_events_series_id.title ===
            "Reboot Democracy Lecture Series"
          );
        });

        alleventsData.value = tempData;
        alleventsData.value.sort(
          (b, a) =>
            new Date(b.event_element.date).getTime() -
            new Date(a.event_element.date).getTime()
        );

        const seriesResult = await fetchSeriesData();
        seriesData.value = seriesResult;

        if (seriesData.value && seriesData.value.length > 1) {
          eventTitle.value = seriesData.value[1].title || "";
          eventDescription.value = seriesData.value[1].description || "";
          eventFullDescription.value =
            seriesData.value[1].full_description || "";
          formattedBody();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    onMounted(() => {
      fetchData();
    });

    const formattedBody = () => {
      if (showingFullText.value) {
        accordionContent.value = eventFullDescription.value;
      } else {
        if (eventFullDescription.value) {
          const lines = eventFullDescription.value.split("\n");
          const truncatedLines = lines.slice(0, 2);
          accordionContent.value = truncatedLines.join("\n");
        }
      }
    };

    const scrollMeTo = (refName: string) => {
      const element = document.querySelector(
        `[ref="${refName}"]`
      ) as HTMLElement;
      if (element) {
        const top = element.offsetTop - 80;
        window.scrollTo(0, top);
      }
    };

    // Helper formatting functions
    const formatDateTime = (d1: Date): string => {
      return format(d1, "MMMM d, yyyy, h:mm aa");
    };

    const formatDateOnly = (d1: Date): string => {
      return format(d1, "MMMM d, yyyy");
    };

    const isPastDate = (d1: Date): boolean => {
      return isPast(d1);
    };

    const isFutureDate = (d1: Date): boolean => {
      return isFuture(new Date(d1));
    };

    return {
      iniLoad,
      showingFullText,
      accordionContent,
      indexData,
      eventsData,
      InnovateUSData,
      selectedStatus,
      eventTitle,
      eventDescription,
      eventFullDescription,
      seriesData,
      pageslug,
      alleventsData,
      path,
      formatDateTime,
      formatDateOnly,
      isPastDate,
      isFutureDate,
      formattedBody,
      scrollMeTo,
    };
  },
});
</script>

<template>
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
                  :src="
                    'https://content.thegovlab.com/assets/' +
                    event_item.event_element.thumbnail.id
                  "
                />
                <div
                  v-for="(instructor_item, index) in event_item.event_element
                    .instructor"
                  v-show="index < 1"
                  :key="index"
                >
                  <img
                    :src="
                      'https://content.thegovlab.com/assets/' +
                      instructor_item.innovate_us_instructors_id.headshot.id
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
                  {{ formatDateTime(new Date(event_item.event_element.date)) }}
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
                  'https://content.thegovlab.com/assets/' +
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
        :key="event_item.event_element.id"
        v-show="isPastDate(new Date(event_item.event_element.date))"
      >
        <div class="past-event-col-1">
          <div class="event-thumbnail">
            <img
              v-if="event_item.event_element.thumbnail"
              :src="
                'https://content.thegovlab.com/assets/' +
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
                'https://content.thegovlab.com/assets/' +
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
</template>
