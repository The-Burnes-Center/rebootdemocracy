<template>
  <Hero
    title="Rebooting Democracy in the Age of AI"
    subtitle="Insights on AI, Governance and Democracy"
    firstPartnerLogo="/images/burnes-logo-blues-1.png"
    firstPartnerAlt="Burnes Center for Social Change"
    secondPartnerLogo="/images/the-govlab-logo-white.png"
    secondPartnerAlt="The GovLab"
  />

  <div class="curator-badge-overlay">
    <CuratorBadge
      name="Beth Simone Noveck"
      title="Director at Burnes Center and the Govlab"
      imageUrl="/images/exampleImage.png"
      moreText="More incredible things Beth done in in her"
    />
  </div>

  <section class="page-layout">
    <article class="left-content">
      <TabSwitch :tabs="tabOptions" @tab-changed="handleTabChange">
        <!-- Content for "Latest Posts" tab -->
        <template #latest-posts>
          <article class="left-content">
            <!-- Show loading state -->
            <div v-if="isLoading" class="loading">Loading blogs...</div>

            <!-- Display blogs when loaded -->
            <div v-else-if="postData.length > 0" class="blog-list">
              <PostCard
                v-for="(post, index) in postData"
                :key="post.id"
                :tag="getPostTag(post)"
                :titleText="post.title"
                :author="getAuthorName(post)"
                :excerpt="post.excerpt || ''"
                :imageUrl="getImageUrl(post.image)"
                :date="new Date(post.date)"
                :tagIndex="index % 5"
                variant="default"
                :hoverable="true"
              />
            </div>
            <!-- No blogs found message -->
            <div v-else class="no-blogs">No blog posts found.</div>
            <div class="btn-mid">
            <Button variant="primary" width="123px" height="36px" @click="handleBtnClick"
            >View All</Button>
            </div>
          </article>
        </template>
      </TabSwitch>
    </article>

    <aside class="right-content">
      <AuthorBadge
        name="Tiago C. Peixoto"
        title="Senior Public Sector Specialist"
        imageUrl="/images/exampleImage.png"
      />
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

      <!-- Event section with loading state -->
      <div v-if="isEventLoading" class="loading">Loading event...</div>
      <UpcomingCard
        v-else-if="latestEvent"
        :title="latestEvent.title"
        :excerpt="latestEvent.description"
        :imageUrl="getImageUrl(latestEvent.thumbnail)"
        :onClick="() => latestEvent && handleEventClick(latestEvent)"
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
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import type { BlogPost, Author, Event, WeeklyNews } from "@/types/index.ts";

// Constants
const directusUrl = "https://content.thegovlab.com";
const DEFAULT_EDITION = "51";
const route = useRouter();
// State
const postData = ref<BlogPost[]>([]);
const isLoading = ref(true);
const activeTab = ref(0);
const latestEvent = ref<Event | null>(null);
const isEventLoading = ref(true);
const latestWeeklyNews = ref<WeeklyNews | null>(null);
const dataFetchError = ref<string | null>(null);
const featuredBlog = ref<BlogPost | null>(null);

// Computed
const editionNumber = computed(() => {
  if (!latestWeeklyNews.value?.edition) return DEFAULT_EDITION;
  return String(latestWeeklyNews.value.edition).replace(/\D/g, "");
});

const weeklyNewsUrl = computed(
  () => `https://rebootdemocracy.ai/newsthatcaughtoureye/${editionNumber.value}`
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
    url: "https://rebootdemocracy.ai/events",
    external: true,
  },
]);

// Methods
function getImageUrl(image: any, width: number = 512): string {
  if (!image?.filename_disk) {
    return "/images/exampleImage.png";
  }

  // Construct URL with width parameter
  return `${directusUrl}/assets/${image.filename_disk}?width=${width}`;
}

const getAuthorName = (post: BlogPost): string => {
  if (post.authors?.[0]?.team_id) {
    const author = post.authors[0].team_id;
    return `${author.First_Name} ${author.Last_Name}`;
  }
  return "Unknown Author";
};

const getPostTag = (post: BlogPost): string => {
  return post.Tags?.[0] || "Blog";
};

const handleEventClick = (event: Event | null) => {
  if (!event?.link) {
    console.log("Event clicked, but no URL available");
    return;
  }
  window.open(event.link, "_blank");
};

const handleBtnClick = () => {
  route.push("/blog");
};

// Data loading functions
const loadAllBlogs = async () => {
  if (postData.value.length > 0) return;

  try {
    isLoading.value = true;

    // First, get featured blog
    const featured = await fetchFeaturedBlog();
    featuredBlog.value = featured;
    console.log("Featured blog:", featured);

    // Then get the rest of the blogs
    const allBlogs = await fetchBlogData();

    // Exclude the featured one if it exists in allBlogs
    const remainingBlogs = featured
      ? allBlogs.filter((blog) => blog.id !== featured.id)
      : allBlogs;

      console.log("Remaining blogs:", remainingBlogs);
      // Final list: featured first, then others
    postData.value = featured ? [featured, ...remainingBlogs] : remainingBlogs;

  } catch (error) {
    console.error("Failed to load blogs:", error);
    dataFetchError.value = "Failed to load blog posts. Please try again later.";
    postData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleTabChange = (index: number, name: string) => {
  activeTab.value = index;
  if (name === "latest-posts") {
    loadAllBlogs();
  }
};

// Load all required data concurrently
const loadInitialData = async () => {
  try {
    // Always fetch weekly news and event data
    const promises: (
      | Promise<BlogPost[]>
      | Promise<Event | null>
      | Promise<WeeklyNews | null>
    )[] = [fetchLatestPastEvent(), fetchLatestWeeklyNews()];

    // Only fetch blog data if we're on the first tab
    if (activeTab.value === 0) {
      promises.unshift(fetchBlogData());
      isLoading.value = true;
    } else {
      promises.unshift(Promise.resolve([]));
    }

    const [blogData, eventData, weeklyNewsData] = await Promise.all(promises);

    // Process results
    if (activeTab.value === 0) {
      postData.value = Array.isArray(blogData) ? blogData : [];
    }

    latestEvent.value = Array.isArray(eventData)
      ? null
      : (eventData as Event | null);
    latestWeeklyNews.value =
      Array.isArray(weeklyNewsData) || !(weeklyNewsData as WeeklyNews)?.edition
        ? null
        : (weeklyNewsData as WeeklyNews);
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  } finally {
    isLoading.value = false;
    isEventLoading.value = false;
  }
};

// Lifecycle hooks
onMounted(loadInitialData);
</script>
