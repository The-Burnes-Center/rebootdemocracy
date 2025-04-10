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
      <article
        class="left-content"
        :class="{ 'search-active': showSearchResults }"
      >
        <TabSwitch :tabs="tabOptions" @tab-changed="handleTabChange">
          <!-- Latest Posts Tab -->
          <template #latest-posts>
            <article class="left-content">
              <!--               
               <blockquote class="quote-block">
              " AI in a manner that fosters public trust and confidence while protecting
              privacy, civil rights, civil liberties, and American values."
              <span class="quote-block-footer">— John Smith, Software Engineer</span>
            </blockquote> -->

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

                <div v-else class="no-blogs">No blog posts found.</div>

                <div
                  class="btn-mid"
                  v-if="allBlogsLoaded && !showSearchResults"
                >
                  <Button
                    variant="primary"
                    width="123px"
                    height="36px"
                    @click="handleBtnClick"
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
          <!-- Row 1 -->
          <div class="collaborators-row">
            <AuthorBadge
              name="Audrey Tang"
              title="Taiwan’s first Minister of Digital Affairs"
              imageUrl="/images/Audrey_Tang.png"
            />
            <AuthorBadge
              name="Dane Gambrell"
              title="Fellow at Burnes Center"
              imageUrl="/images/Dane_Gambrell.png"
            />
          </div>

          <!-- Row 2 -->
          <div class="collaborators-row">
            <AuthorBadge
              name="Tiago C. Peixoto"
              title="Senior Public Sector Specialist"
              imageUrl="/images/Tiago_C_Peixoto.png"
            />
            <AuthorBadge
              name="Autumn Sloboda"
              title="Fellow at Burnes Center"
              imageUrl="/images/Autumn_Sloboda.png"
            />
          </div>

          <!-- Row 3 -->
          <div class="collaborators-row">
            <AuthorBadge
              name="Giulio Quaggiotto"
              title="Head of UNDP’s Strategic Innovation unit"
              imageUrl="/images/Giulio_Quaggiotto.png"
            />
            <AuthorBadge
              name="Jacob Kemp"
              title="AI & Social Impact Fellow"
              imageUrl="/images/Jacob_Kemp.png"
            />
          </div>

          <!-- Row 4 -->
          <div class="collaborators-row">
            <AuthorBadge
              name="Seth Harris"
              title="Senior Fellow at Burnes Center"
              imageUrl="/images/Seth_Harris.png"
            />
            <AuthorBadge
              name="Hannah Hetzer"
              title="Fellow at Burnes Center"
              imageUrl="/images/Hannah_Hetzer.png"
            />
          </div>

          <!-- Row 5 -->
          <div class="collaborators-row">
            <AuthorBadge
              name="Bonnie McGilpin"
              title="Fellow at Burnes Center"
              imageUrl="/images/Bonnie_McGilpin.png"
            />
            <AuthorBadge
              name="Anirudh Dinesh"
              title="Fellow at Burnes Center"
              imageUrl="/images/Anirudh_Dinesh.png"
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
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import type { BlogPost, Author, Event, WeeklyNews } from "@/types/index.ts";
import { fetchUpcomingEvent } from "~/composables/fetchLatestPastEvent";

// Get search state
const { showSearchResults } = useSearchState();

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
const allBlogsLoaded = ref(false);
const isFutureEvent = ref(true);

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

    // Then get the rest of the blogs
    const allBlogs = await fetchBlogData();

    // Exclude the featured one if it exists in allBlogs
    const remainingBlogs = featured
      ? allBlogs.filter((blog) => blog.id !== featured.id)
      : allBlogs;

    postData.value = featured ? [featured, ...remainingBlogs] : remainingBlogs;
    allBlogsLoaded.value = true;
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

const loadEventData = async () => {
  try {
    let event = await fetchUpcomingEvent();

    if (event) {
      isFutureEvent.value = true;
      latestEvent.value = event;
    } else {
      event = await fetchLatestPastEvent();
      isFutureEvent.value = false;
      latestEvent.value = event;
    }
  } catch (error) {
    console.error("Failed to load event:", error);
  } finally {
    isEventLoading.value = false;
  }
};

// Load all required data concurrently
const loadInitialData = async () => {
  try {
    const promises: [Promise<BlogPost[] | []>, Promise<WeeklyNews | null>] = [
      activeTab.value === 0 ? fetchBlogData() : Promise.resolve([]),
      fetchLatestWeeklyNews(),
    ];

    const [blogData, weeklyNewsData] = await Promise.all(promises);

    if (activeTab.value === 0 && Array.isArray(blogData)) {
      postData.value = blogData;
    }

    latestWeeklyNews.value =
      weeklyNewsData && (weeklyNewsData as WeeklyNews)?.edition
        ? weeklyNewsData
        : null;
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle hooks
onMounted(async () => {
  await loadInitialData();
  await loadEventData();
});
</script>
