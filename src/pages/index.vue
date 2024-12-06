<!-- src/pages/index.vue -->
<script lang="ts" setup>
import { ref, onMounted, onServerPrefetch } from 'vue';
import { createDirectus, rest, readItems } from '@directus/sdk';

// Import components
import HeaderComponent from "../components/header.vue";
import FooterComponent from "../components/footer.vue";
import MailingListComponent from "../components/mailing.vue";
import { VueFinalModal, ModalsContainer } from 'vue-final-modal';

// Refs for the data that was previously in data()
const indexData = ref<any[]>([]);
const eventsData = ref<any[]>([]);
const featuredData = ref<any[]>([]);

const directus = createDirectus('https://content.thegovlab.com').with(rest());

// Async functions to fetch data
async function fetchIndex() {
  try {
    const data = await directus.request(
      readItems('reboot_democracy', {
        meta: 'total_count',
        limit: -1,
        fields: ['*.*'],
      })
    );
    indexData.value = data; // data should already be array or object as returned by Directus
  } catch (error) {
    console.error('Error fetching index data:', error);
  }
}

async function fetchEvents() {
  try {
    const data = await directus.request(
      readItems('reboot_democracy_resources', {
        filter: {
          _and: [
            { type: { _eq: 'Event' } },
            { date: { _gte: '$NOW' } },
          ],
        },
        meta: 'total_count',
        limit: 2,
        sort: ['date'],
        fields: ['*.*', 'thumbnail.*', 'event_series.general_events_series_id.*'],
      })
    );
    eventsData.value = data;
  } catch (error) {
    console.error('Error fetching events data:', error);
  }
}

async function fetchFeatured() {
  try {
    const data = await directus.request(
      readItems('reboot_democracy_blog', {
        filter: { status: { _eq: 'published' } },
        meta: 'total_count',
        limit: 6,
        sort: ['-date'],
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
        ],
      })
    );
    featuredData.value = data;
  } catch (error) {
    console.error('Error fetching featured data:', error);
  }
}

// A helper function to fetch all required data
async function fetchAllData() {
  await Promise.all([
    fetchIndex(),
    fetchEvents(),
    fetchFeatured(),
    // Add other fetch calls here if you uncomment them and need them
  ]);
}

// SSR mode: fetch data before rendering so the HTML is pre-generated with content
if (import.meta.env.SSR) {
  onServerPrefetch(async () => {
    await fetchAllData();
  });
} else {
  // Dev mode: fetch data after the component mounts
  onMounted(async () => {
    await fetchAllData();
  });
}
</script>

<template>
  <div>
    <header-comp />
    
    <!-- Main content -->
    <div>
      <!-- Example usage of fetched data -->
      <section v-if="indexData && indexData.length">
        <h2>Index Section</h2>
        <!-- Render indexData content as needed -->
        <div v-for="(item, i) in indexData" :key="i">
          <p>{{ item.title }}</p>
        </div>
      </section>

      <section v-if="eventsData && eventsData.length">
        <h2>Upcoming Events</h2>
        <div v-for="(event, i) in eventsData" :key="i">
          <h3>{{ event.title }}</h3>
          <p>{{ event.date }}</p>
        </div>
      </section>

      <section v-if="featuredData && featuredData.length">
        <h2>Featured Posts</h2>
        <div v-for="(post, i) in featuredData" :key="i">
          <h3>{{ post.title }}</h3>
          <div v-html="post.excerpt"></div>
        </div>
      </section>
    </div>

    <mailing-list-comp />
    <vue-final-modal />
    <modals-container />
    <footer-comp />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
}
</style>
