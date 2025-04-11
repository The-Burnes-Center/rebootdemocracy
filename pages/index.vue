<template>
  <div class="home-page">
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />

    <div class="curator-badge-overlay">
      <CuratorBadge
        name="Beth Simone Noveck"
        title="Director at Burnes Center and the Govlab"
        imageUrl="/images/Beth_Simone_Noveck.png"
        moreText="More incredible things Beth done in in her"
      />
    </div>

    <section class="page-layout">
      <article class="left-content" :class="{ 'search-active': showSearchResults }">
        <TabSwitch :tabs="tabOptions" @tab-changed="handleTabChange">
          <!-- Latest Posts Tab -->
          <template #latest-posts>
            <article class="left-content-blog">
              <!-- Show GlobalSearch when searching -->
              <GlobalSearch v-if="showSearchResults" />

              <!-- Otherwise show regular posts -->
              <template v-else>
                <!-- Loading state -->
                <div v-if="isLoading" class="loading">
                  <div class="loading-spinner"></div>
                  <div>Loading blogs...</div>
                </div>

                <div v-else-if="postData.length > 0" class="blog-list">
                  <PostCard
                    v-for="(post, index) in postData"
                    :key="post.id"
                    :tag="post.Tags?.[0] || 'Blog'"
                    :titleText="post.title"
                    :author="getAuthorName(post)"
                    :excerpt="post.excerpt || ''"
                    :imageUrl="getImageUrl(post.image)"
                    :date="new Date(post.date)"
                    :tagIndex="index % 5"
                    variant="default"
                    :hoverable="true"
                    @click="navigateToBlogPost(post)"
                  />
                </div>

                <div v-else class="no-blogs">No blog posts found.</div>

                <div class="btn-mid" v-if="allBlogsLoaded && !showSearchResults">
                  <Button
                    variant="primary"
                    width="123px"
                    height="36px"
                    @click="() => router.push('/blog')"
                  >
                    View All
                  </Button>
                </div>
              </template>
            </article>
          </template>
        </TabSwitch>
      </article>

      <!-- Sidebar -->
      <aside class="right-content">
        <!-- Blog collaborators container -->
        <div class="blog-collaborators-container">
          <Text
            as="h2"
            fontFamily="inter"
            size="lg"
            color="text-primary"
            weight="bold"
            align="center"
            margin="md"
          >
            Our Collaborators
          </Text>
          
          <!-- Collaborators rows -->
          <div v-for="(rowData, rowIndex) in collaborators" :key="rowIndex" class="collaborators-row">
            <AuthorBadge
              v-for="author in rowData"
              :key="author.name"
              :name="author.name"
              :title="author.title"
              :imageUrl="author.imageUrl"
            />
          </div>
        </div>
        
        <Text
          as="a"
          href="/team"
          size="sm"
          fontFamily="inria"
          align="center"
          weight="extrabold"
          lineHeight="normal"
          color="link-primary"
        >
          Meet Our Team
        </Text>

        <div v-if="isEventLoading" class="loading">Loading event...</div>
        <UpcomingCard
          v-if="latestEvent"
          :title="latestEvent.title"
          :excerpt="latestEvent.description"
          :imageUrl="getImageUrl(latestEvent.thumbnail)"
          :onClick="() => handleEventClick(latestEvent)"
          :buttonLabel="isFutureEvent ? 'Register' : 'Watch'"
          :cardTitle="isFutureEvent ? 'Upcoming Event' : 'Featured Event'"
        />

        <SignUpButtonWidget
          title="Sign Up for updates"
          placeholder="Enter your email"
          buttonLabel="Sign Up"
          backgroundColor="#F9F9F9"
        />

        <InnovateUsCard
          description="InnovateUS provides no-cost, at-your-own pace, and live learning. on data, digital, innovation, and AI skills for public service professionals like you."
          buttonLabel="Learn more"
          learnMoreUrl="https://innovateus.example.com"
        />
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import type { BlogPost, Event, WeeklyNews } from "@/types/index.ts";

// Constants
const DIRECTUS_URL = "https://content.thegovlab.com";
const DEFAULT_EDITION = "51";
const router = useRouter();

// State
const { showSearchResults, resetSearch } = useSearchState();
const postData = ref<BlogPost[]>([]);
const isLoading = ref(true);
const activeTab = ref(0);
const latestEvent = ref<Event | null>(null);
const isEventLoading = ref(true);
const latestWeeklyNews = ref<WeeklyNews | null>(null);
const dataFetchError = ref<string | null>(null);
const featuredBlog = ref<BlogPost | null>(null);
const allBlogsLoaded = ref(false);
const isFutureEvent = ref(true);
const blogsInitialized = ref(false);

// Collaborators data structure
const collaborators = [
  [
    { name: "Audrey Tang", title: "Taiwan's first Minister of Digital Affairs", imageUrl: "/images/Audrey_Tang.png" },
    { name: "Dane Gambrell", title: "Fellow at Burnes Center", imageUrl: "/images/Dane_Gambrell.png" }
  ],
  [
    { name: "Tiago C. Peixoto", title: "Senior Public Sector Specialist", imageUrl: "/images/Tiago_C_Peixoto.png" },
    { name: "Autumn Sloboda", title: "Fellow at Burnes Center", imageUrl: "/images/Autumn_Sloboda.png" }
  ],
  [
    { name: "Giulio Quaggiotto", title: "Head of UNDP's Strategic Innovation unit", imageUrl: "/images/Giulio_Quaggiotto.png" },
    { name: "Jacob Kemp", title: "AI & Social Impact Fellow", imageUrl: "/images/Jacob_Kemp.png" }
  ],
  [
    { name: "Seth Harris", title: "Senior Fellow at Burnes Center", imageUrl: "/images/Seth_Harris.png" },
    { name: "Hannah Hetzer", title: "Fellow at Burnes Center", imageUrl: "/images/Hannah_Hetzer.png" }
  ],
  [
    { name: "Bonnie McGilpin", title: "Fellow at Burnes Center", imageUrl: "/images/Bonnie_McGilpin.png" },
    { name: "Anirudh Dinesh", title: "Fellow at Burnes Center", imageUrl: "/images/Anirudh_Dinesh.png" }
  ]
];

// Computed
const editionNumber = computed(() => 
  latestWeeklyNews.value?.edition 
    ? String(latestWeeklyNews.value.edition).replace(/\D/g, "") 
    : DEFAULT_EDITION
);

const weeklyNewsUrl = computed(() => 
  `https://rebootdemocracy.ai/newsthatcaughtoureye/${editionNumber.value}`
);

const tabOptions = computed(() => [
  { title: "Latest Posts", name: "latest-posts" },
  {
    title: "News that caught our eye",
    name: "news",
    url: weeklyNewsUrl.value,
    external: true,
  },
  {
    title: "Events",
    name: "events",
    url: "/events",
  },
]);

// Methods
function getImageUrl(image: any, width: number = 512): string {
  return image?.filename_disk 
    ? `${DIRECTUS_URL}/assets/${image.filename_disk}?width=${width}`
    : "/images/exampleImage.png";
}

const getAuthorName = (post: BlogPost): string => {
  const author = post.authors?.[0]?.team_id;
  return author ? `${author.First_Name} ${author.Last_Name}` : "Unknown Author";
};

const navigateToBlogPost = (post: BlogPost) => {
  if (post.slug) {
    resetSearch();
    router.push(`/blog/${post.slug}`);
  } else {
    console.error('Cannot navigate: Blog post has no slug', post);
  }
};

const handleEventClick = (event: Event | null) => {
  if (event?.link) {
    window.open(event.link, "_blank");
  }
};

const handleTabChange = (index: number, name: string) => {
  activeTab.value = index;
  if (name === "latest-posts") {
    resetSearch();
    loadBlogData();
  }
};

// Data loading functions
const loadBlogData = async (force = false) => {
  if (blogsInitialized.value && !force) return;
  
  try {
    isLoading.value = true;
    
    // Get featured blog and all blogs
    const [featured, allBlogs] = await Promise.all([
      fetchFeaturedBlog(),
      fetchBlogData()
    ]);
    
    featuredBlog.value = featured;
    
    // Exclude the featured blog if it exists in allBlogs
    const remainingBlogs = featured
      ? allBlogs.filter((blog) => blog.id !== featured.id)
      : allBlogs;
      
    postData.value = featured ? [featured, ...remainingBlogs] : remainingBlogs;
    allBlogsLoaded.value = true;
    blogsInitialized.value = true;
  } catch (error) {
    console.error("Failed to load blogs:", error);
    dataFetchError.value = "Failed to load blog posts. Please try again later.";
    postData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const loadEventData = async () => {
  try {
    isEventLoading.value = true;
    
    // Try to get upcoming event first
    let event = await fetchUpcomingEvent();
    
    if (event) {
      isFutureEvent.value = true;
    } else {
      // If no upcoming event, get the latest past event
      event = await fetchLatestPastEvent();
      isFutureEvent.value = false;
    }
    
    latestEvent.value = event;
  } catch (error) {
    console.error("Failed to load event:", error);
  } finally {
    isEventLoading.value = false;
  }
};

const loadInitialData = async () => {
  try {
    resetSearch();
    
    // Load weekly news and blog data in parallel
    await Promise.all([
      (async () => {
        latestWeeklyNews.value = await fetchLatestWeeklyNews();
      })(),
      (async () => {
        if (activeTab.value === 0) {
          await loadBlogData();
        }
      })()
    ]);
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  }
};

// Lifecycle hooks
onMounted(async () => {
  resetSearch();
  
  // Load data in parallel
  await Promise.all([
    loadInitialData(),
    loadEventData()
  ]);
});

// Watch for tab changes
watch(activeTab, (newTabIndex) => {
  if (newTabIndex === 0 && !isLoading.value) {
    resetSearch();
    nextTick(() => {
      if (!blogsInitialized.value) {
        loadBlogData();
      }
    });
  }
});

// Handle navigation
onBeforeRouteLeave((to, from, next) => {
  resetSearch();
  next();
});

</script>