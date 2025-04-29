<template>
  <div>


    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading content...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <Button variant="primary" @click="router.push('/')">Return to Home</Button>
    </div>

    <template v-else-if="postData && postData.length > 0">
      <div class="weeklynews-hero">
        <img class="weeklynews-img" src="/images/newsheader.png" />
        <div class="weeklynews-details">
          <h1>{{ postData[0].title }}</h1>
          <p>
            Published by {{ postData[0].author }} on 
            {{ formatDateOnly(new Date(postData[0].date)) }}
          </p>
        </div>
      </div>
      
      <!-- Table of Contents -->
      <div class="toc">
        <p class="excerpt">{{ postData[0].summary }}</p><br>
        <p><strong>In the news this week</strong></p>
        <ul>
          <li v-for="cat in uniqueCategories" :key="cat">
            <a :href="'#' + cat.toLowerCase().replace(/\s+/g, '')">
              <strong>{{ cat }}:</strong>
            </a>
            <span class="toc-description">
              {{
                cat === 'AI and Elections' ? 'Free, fair and frequent' :
                cat === 'Governing AI' ? 'Setting the rules for a fast-moving technology.' :
                cat === 'AI for Governance' ? 'Smarter public institutions through machine intelligence.' :
                cat === 'AI and Public Engagement' ? 'Bolstering participation' :
                cat === 'AI and Problem Solving' ? 'Research, applications, technical breakthroughs' :
                cat === 'AI Infrastructure' ? 'Computing resources, data systems and energy use' :
                cat === 'AI and International Relations (IR)' ? "Global cooperation—or competition—over AI's future" :
                cat === 'AI and Education' ? 'Preparing people for an AI-driven world' :
                cat === 'AI and Public Safety' ? 'Law enforcement, disaster prevention and preparedness' :
                cat === 'AI and Labor' ? 'Worker rights, safety and opportunity' :
                'News that caught our eye'
              }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Grouped News Items by Category -->
      <div class="news-items">
        <div v-for="cat in uniqueCategories" :key="cat">
          <h2 :id="cat.toLowerCase().replace(/\s+/g, '')" class="group-heading">
            {{ cat }}
          </h2>
          <div v-for="item in postData[0].items.filter(item => (item.reboot_democracy_weekly_news_items_id.category || 'News that caught our eye') === cat)"
              :key="item.reboot_democracy_weekly_news_items_id.id"
              class="news-item">
            <p class="category-badge">
              <span>{{ item.reboot_democracy_weekly_news_items_id.category || 'News that caught our eye' }}</span>
            </p>
            <h4 class="item-title"><strong>{{ item.reboot_democracy_weekly_news_items_id.title }}</strong></h4>
            <div class="item-meta">
              <p><em>
                {{ item.reboot_democracy_weekly_news_items_id.author }} on 
                {{ formatDateOnly(new Date(item.reboot_democracy_weekly_news_items_id.date)) }} in 
                {{ item.reboot_democracy_weekly_news_items_id.publication }}
              </em></p>
            </div>
            <p class="item-excerpt">{{ item.reboot_democracy_weekly_news_items_id.excerpt }}</p>
            <a :href="item.reboot_democracy_weekly_news_items_id.url" class="read-article" target="_blank">
              Read article
            </a>
          </div>
        </div>
      </div>
    </template>


  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format, isPast } from 'date-fns';
import { useDirectusClient } from '@/composables/useDirectusClient';


// Define interfaces for type safety
interface WeeklyNewsItem {
  id: string;
  title: string;
  author: string;
  publication: string;
  date: string;
  excerpt: string;
  url: string;
  category?: string;
}

interface WeeklyNewsItemWrapper {
  reboot_democracy_weekly_news_items_id: WeeklyNewsItem;
}

interface ImageItem {
  id: string;
  filename_disk: string;
  width?: number;
  height?: number;
}

interface WeeklyNewsPost {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  edition: string;
  status: string;
  items: WeeklyNewsItemWrapper[];
  image?: ImageItem;
}

// Setup route and state
const route = useRoute();
const router = useRouter();
const { directus, readItems } = useDirectusClient();
const slug = computed(() => route.params.slug as string);

// State
const postData = ref<WeeklyNewsPost[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Computed properties
const uniqueCategories = computed(() => {
  if (!postData.value.length || !postData.value[0].items) return [];
  
  const cats = postData.value[0].items.map(
    item => item.reboot_democracy_weekly_news_items_id.category || "News that caught our eye"
  );
  
  return [...new Set(cats)];
});

// Helper functions
const formatDateOnly = (date: Date): string => {
  return format(date, "MMMM d, yyyy");
};

const fetchPostData = async (edition: string): Promise<{ data: WeeklyNewsPost[] }> => {
  try {
    const response = await directus.request(
      readItems("reboot_democracy_weekly_news", {
        meta: "total_count",
        limit: -1,
        fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"],
        filter: {
          _and: [
            {
              edition: {
                _eq: edition,
              },
            },
            {
              status: {
                _eq: "published",
              },
            }
          ],
        },
      })
    );
    
    return { data: response as WeeklyNewsPost[] };
  } catch (err) {
    console.error("Error fetching post data:", err);
    throw err;
  }
};

// Meta tags setup
const fillMeta = () => {
  if (!postData.value || !postData.value[0]) return;
  
  // Create plain text version of summary
  const htmlToText = document.createElement('div');
  htmlToText.innerHTML = postData.value[0].summary;
  
  const imageUrl = postData.value[0].image
    ? `${directus.url}/assets/${postData.value[0].image.id}`
    : `${directus.url}/assets/4650f4e2-6cc2-407b-ab01-b74be4838235`;
    
  const imageWidth = postData.value[0].image?.width?.toString() || '';
  const imageHeight = postData.value[0].image?.height?.toString() || '';
  
  useHead({
    title: `RebootDemocracy.AI Blog | ${postData.value[0].title}`,
    meta: [
      { name: 'title', content: `RebootDemocracy.AI Blog | ${postData.value[0].title}` },
      { name: 'description', content: postData.value[0].summary || htmlToText.textContent?.substring(0, 200) + '...' },
      { property: 'og:title', content: `RebootDemocracy.AI Blog | ${postData.value[0].title}` },
      { property: 'og:type', content: "website" },
      { property: 'og:url', content: `https://rebootdemocracy.ai/newsthatcaughtoureye/${postData.value[0].edition}` },
      { property: 'og:description', content: postData.value[0].summary || htmlToText.textContent?.substring(0, 200) + '...' },
      { property: 'og:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
      { property: 'og:image:width', content: imageWidth },
      { property: 'og:image:height', content: imageHeight },
      { property: 'twitter:title', content: "RebootDemocracy.AI" },
      { property: 'twitter:description', content: postData.value[0].summary || htmlToText.textContent?.substring(0, 200) + '...' },
      { property: 'twitter:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
      { property: 'twitter:card', content: "summary_large_image" },
    ],
  });
};

const fillMetaDefault = () => {
  useHead({
    title: "RebootDemocracy.AI",
    meta: [
      { name: 'title', content: "RebootDemocracy.AI" },
      { property: 'og:title', content: "RebootDemocracy.AI" },
      { property: 'og:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. ...` },
      { property: 'og:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
      { property: 'og:type', content: "website" },
      { property: 'og:url', content: "https://rebootdemocracy.ai" },
      { property: 'twitter:title', content: "RebootDemocracy.AI" },
      { property: 'twitter:description', content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. ...` },
      { property: 'twitter:image', content: "https://rebootdemocracy.ai/assets/newsheader.40a0340b.jpg" },
      { property: 'twitter:card', content: "summary_large_image" },
    ],
  });
};

// Fetch data on mount
onMounted(async () => {
  try {
    isLoading.value = true;
    
    if (!slug.value) {
      error.value = "No edition specified";
      fillMetaDefault();
      return;
    }
    
    const response = await fetchPostData(slug.value);
    postData.value = response.data;
    
    if (postData.value.length === 0) {
      error.value = "Edition not found";
      fillMetaDefault();
      return;
    }
    
    fillMeta();
  } catch (err) {
    console.error("Error loading post data:", err);
    error.value = "Failed to load content. Please try again later.";
    fillMetaDefault();
  } finally {
    isLoading.value = false;
  }
});
</script>

<style>

.weeklynews-hero {
  width: 100%;
  display: flex;
  padding: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.weeklynews-hero h1 {
  margin-top: -8rem;
  z-index: 100;
  color: #ffffff;
  font-size: 40px;
  font-family: var(--font-inria);
}

.weeklynews-img {
  height: 200px;
  width: 100%;
  object-fit: fill;
}

.weeklynews-details p {
  color: #ffffff;
  font-weight: 600;
}

/* Table of Contents Section */
.toc {
  padding: 1rem 10rem;
}

.toc ul {
  padding-left: 0;
  margin-top: 1em;
}

.toc li {
  color: #0D63EB;
  margin-bottom: 0.5em;
}

.toc a {
  color: #0D63EB;
  text-decoration: none;
  font-family: var(--font-inria);
}

.toc p {
  font-size: 18px;
  line-height: 1.8;
  margin-left: 1em;
  font-family: var(--font-inria);
}

.toc .news-heading {
  font-family: var(--font-inria);
}

.toc-description {
  color: #3d3d3d;
  margin-left: 0.5em;
}

/* Group Heading */
.group-heading {
  color: #0D63EB;
  border-bottom: 1px solid #0D63EB;
  padding-bottom: 5px;
  font-family: var(--font-inria);
}

/* News Items */
.news-items {
  padding: 0rem 10rem;
}

.news-item {
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.category-badge span {
  background-color: #519E8A;
  color: #ffffff;
  font-size: 10px;
  padding: 0.5em;
}

.item-title {
  color: #0D63EB;
  font-family: var(--font-inter);
}

.item-meta {
  margin: 0;
  font-family: var(--font-inria);
}

.item-excerpt {
   font-family: var(--font-inter);
   line-height: 32px;
}

.read-article {
  background-color: #0D63EB;
  color: #ffffff;
  text-decoration: none;
  text-transform: uppercase;
  padding: 0.25rem 0.25rem;
  width: fit-content;
  font-size: 12px;
  font-family: var(--font-inria);
  font-weight: 600;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .weeklynews-hero h1 {
    font-size: 24px;
        margin-top: -7rem;
        margin-left: 1rem;
        margin-right: 1rem;
        
  }
  .weeklynews-details p{
    margin-left:1rem;
    margin-right:1rem;
  }

  .weeklynews-img {
    height: 150px;
  }

  .weeklynews-header, .toc, .news-items {
    padding: 1rem;
  }
}

</style>