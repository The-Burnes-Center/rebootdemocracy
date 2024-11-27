<script setup lang="ts">
import { ref, watch, onMounted, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';
import { Directus } from '@directus/sdk';
import format from 'date-fns/format';
import isPast from 'date-fns/isPast';
import HeaderComponent from '../components/header.vue';
import FooterComponent from '../components/footer.vue';
import ModalComp from '../components/modal.vue';
import { VueFinalModal, ModalsContainer } from 'vue-final-modal';
import { useHead } from '@vueuse/head';
import { fetchBlogData } from '../helpers/blogHelper.js';

const route = useRoute();
const slug = ref(route.params.name);
const postData = ref([]);
const modalData = ref([]);
const showModal = ref(false);
const directus = new Directus('https://content.thegovlab.com/');
const path = ref(route.fullPath);
const isDataLoaded = ref(false);

// Formatting functions
function formatTimeOnly(d1: Date | string): string {
  return format(new Date(d1), 'h:mm aa');
}

function formatDateTime(d1: Date | string): string {
  return format(new Date(d1), 'MMMM d, yyyy, h:mm aa');
}

function formatDateOnly(d1: Date | string): string {
  return format(new Date(d1), 'MMMM d, yyyy');
}

function PastDate(d1: Date | string): boolean {
  return isPast(new Date(d1));
}

// Fetch blog data
async function fetchBlog() {
  try {
    const response = await fetchBlogData(directus, slug.value);
    postData.value = response.data;
    console.log(postData.value);
    if (postData.value.length === 0) {
      // Handle no data case
      window.location.href = '/';
    } else {
      fillMeta();
    }
  } catch (error) {
    console.error('An error occurred while fetching the blog data:', error);
  } finally {
    isDataLoaded.value = true;
  }
}

// Load modal data
async function loadModal() {
  try {
    const { data } = await directus.items('reboot_democracy_modal').readByQuery({
      meta: 'total_count',
      limit: -1,
      fields: ['*.*'],
    });

    modalData.value = data;
    console.log(modalData.value);

    const storageItem = localStorage.getItem('Reboot Democracy');
    showModal.value =
      modalData.value.status === 'published' &&
      (modalData.value.visibility === 'always' ||
        (modalData.value.visibility === 'once' && storageItem !== 'off'));
  } catch (error) {
    console.error('Error loading modal data:', error);
  }
}

function closeModal() {
  showModal.value = false;
  localStorage.setItem('Reboot Democracy', 'off');
}

// Set meta tags
function fillMeta() {
  const post = postData.value[0];
  if (!post) {
    fillMetaDefault();
    return;
  }

  const htmlToText = document.createElement('div');
  htmlToText.innerHTML = post.content;
  const description =
    post.excerpt !== ''
      ? post.excerpt
      : (htmlToText.textContent?.substring(0, 200) ?? '') + '...';

  useHead({
    title: 'RebootDemocracy.AI Blog | ' + post.title,
    meta: [
      { name: 'title', content: 'RebootDemocracy.AI Blog | ' + post.title },
      { name: 'description', content: description },
      { property: 'og:title', content: 'RebootDemocracy.AI Blog | ' + post.title },
      { property: 'og:description', content: description },
      {
        property: 'og:image',
        content: post.image
          ? directus._url + 'assets/' + post.image.filename_disk
          : directus._url + 'assets/4650f4e2-6cc2-407b-ab01-b74be4838235',
      },
      { property: 'og:image:width', content: '800' },
      { property: 'og:image:height', content: '800' },
      { property: 'twitter:title', content: 'RebootDemocracy.AI Blog | ' + post.title },
      { property: 'twitter:description', content: description },
      {
        property: 'twitter:image',
        content: post.image
          ? directus._url + 'assets/' + post.image.filename_disk
          : directus._url + 'assets/4650f4e2-6cc2-407b-ab01-b74be4838235',
      },
      { property: 'twitter:card', content: 'summary_large_image' },
    ],
  });
}

function fillMetaDefault() {
  const description = `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another

As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`;

  useHead({
    title: 'RebootDemocracy.AI',
    meta: [
      { name: 'title', content: 'RebootDemocracy.AI' },
      { property: 'og:title', content: 'RebootDemocracy.AI' },
      { property: 'og:description', content: description },
      {
        property: 'og:image',
        content: 'https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b',
      },
      { property: 'twitter:title', content: 'RebootDemocracy.AI' },
      { property: 'twitter:description', content: description },
      {
        property: 'twitter:image',
        content: 'https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b',
      },
      { property: 'twitter:card', content: 'summary_large_image' },
    ],
  });
}

// Perform data fetching during SSR
onServerPrefetch(async () => {
  await fetchBlog();
  await loadModal();
});

// For client-side navigation
onMounted(async () => {
  if (!isDataLoaded.value) {
    await fetchBlog();
    await loadModal();
  }
});

// Watch for route changes
watch(
  () => route.fullPath,
  async () => {
    slug.value = route.params.name;
    isDataLoaded.value = false;
    await fetchBlog();
    await loadModal();
  },
  { immediate: true } // Ensure the watcher runs immediately
);
</script>

<template>
  <Suspense>
    <template #default>
      <div>
        <!-- Header Component -->
        <HeaderComponent></HeaderComponent>

        <div v-if="postData.length > 0" class="blog-hero">
          <img
            v-if="postData[0].image"
            class="blog-img"
            :src="directus._url + 'assets/' + postData[0].image.filename_disk + '?width=800'"
          />

          <div class="blog-details">
            <h1>{{ postData[0].title }}</h1>
            <p class="excerpt">{{ postData[0].excerpt }}</p>
            <p class="post-date">
              Published on <b>{{ formatDateOnly(postData[0].date) }}</b>
            </p>

            <div class="hero-author-sm">
              <div v-for="(author, i) in postData[0].authors" :key="i">
                <div class="author-item">
                  <img
                    v-if="author.team_id.Headshot"
                    class="author-headshot"
                    :src="directus._url + 'assets/' + author.team_id.Headshot.id"
                  />
                  <p v-else class="author-no-image">
                    {{ author.team_id.First_Name[0] }} {{ author.team_id.Last_Name[0] }}
                  </p>
                  <div class="author-details">
                    <p class="author-name">
                      {{ author.team_id.First_Name }} {{ author.team_id.Last_Name }}
                    </p>
                    <a
                      class="author-bio"
                      v-if="author.team_id.Link_to_bio"
                      :href="author.team_id.Link_to_bio"
                      >Read Bio</a
                    >
                  </div>
                </div>
              </div>
              <div class="sm-tray">
                <a
                  target="_blank"
                  :href="'http://twitter.com/share?url=https://rebootdemocracy.ai/blog/' + postData[0].slug"
                >
                  <i class="fa-brands fa-square-x-twitter"></i>
                </a>
                <a
                  target="_blank"
                  :href="'https://www.facebook.com/sharer/sharer.php?u=https://rebootdemocracy.ai/blog/' + postData[0].slug"
                >
                  <i class="fa-brands fa-facebook"></i>
                </a>
                <a
                  target="_blank"
                  :href="'https://linkedin.com/shareArticle?url=https://rebootdemocracy.ai/blog/' + postData[0].slug + '&title=' + postData[0].title"
                >
                  <i class="fa-brands fa-linkedin"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <p>Loading...</p>
        </div>

        <!-- Blog content -->
        <div v-if="postData.length > 0" class="blog-body">
          <div class="audio-version" v-if="postData[0].audio_version">
            <p><em>Listen to the AI-generated audio version of this piece.</em></p>
            <p>
              <audio controls>
                <source
                  :src="directus._url + 'assets/' + postData[0].audio_version.id"
                  type="audio/mpeg"
                />
              </audio>
            </p>
          </div>
          <div class="blog-content" v-html="postData[0].content"></div>
          <p v-if="postData[0].ai_content_disclaimer" class="blog-img-byline">
            Some images in this post were generated using AI.
          </p>
        </div>

        <!-- Modal Component -->
        <!-- <ModalComp v-if="showModal" @close="closeModal" :modalData="modalData"></ModalComp> -->

        <!-- Footer Component -->
        <FooterComponent></FooterComponent>
      </div>
    </template>

    <template #fallback>
      <div>
        <p>Loading content...</p>
      </div>
    </template>
  </Suspense>
</template>