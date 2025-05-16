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
        <!-- Mobile search display -->
        <div
          v-if="showSearchResults && isMobile"
          class="search-container"
          :class="{ 'mobile-search': isMobile }"
        >
          <div
            class="search-results-container"
            :class="{ 'mobile-container': isMobile }"
          >
            <div class="search-results-header">
              <h2>Search Results for "{{ searchQuery }}"</h2>
            </div>
            <!-- Pass the searchQuery prop to GlobalSearch -->
            <GlobalSearch :searchQuery="searchQuery" />
          </div>
        </div>

        <!-- Mobile filter bar -->
        <div
          v-if="
            isMobile &&
            !isLoading &&
            selected !== 'All Topics' &&
            !showSearchResults
          "
          class="results-and-filter"
        >
          <div class="results-count">
            <Text
              as="span"
              fontFamily="inter"
              size="base"
              color="text-primary"
              weight="medium"
            >
              Showing blogs filtered by "{{ selected }}"
            </Text>
          </div>
          <div class="filter-actions">
            <Button
              variant="secondary"
              size="small"
              @click="
                () => {
                  selected = 'All Topics';
                  handleTagFilter('All Topics');
                }
              "
            >
              Clear Filter
            </Button>
          </div>
        </div>

        <!-- Hide TabSwitch when showing search results on mobile -->
        <TabSwitch
          v-if="!(showSearchResults && isMobile)"
          :tabs="tabOptions"
          :tagOptions="tagOptions"
          @tab-changed="handleTabChange"
          @tag-filter="
            (tag) => {
              selected = tag;
              handleTagFilter(tag);
            }
          "
        >
          <!-- Latest Posts Tab -->
          <template #latest-posts>
            <article class="left-content-blog">
              <!-- Show GlobalSearch when searching on desktop -->
              <GlobalSearch
                v-if="showSearchResults && !isMobile"
                :searchQuery="searchQuery"
              />
              <!-- Otherwise show regular posts -->
              <template v-else>
                <!-- Loading state -->
                <div v-if="isLoading" class="loading">
                  <div class="loading-spinner"></div>
                  <div>Loading blogs...</div>
                </div>

                <!-- Filter indicator - This appears when a tag filter is active -->
                <div
                  v-if="!isLoading && selected !== 'All Topics' && !isMobile"
                  class="results-and-filter"
                >
                  <div class="results-count">
                    <Text
                      as="span"
                      fontFamily="inter"
                      size="base"
                      color="text-primary"
                      weight="medium"
                    >
                      Showing blogs filtered by "{{ selected }}"
                    </Text>
                  </div>
                  <div class="filter-actions">
                    <Button
                      variant="secondary"
                      size="small"
                      @click="
                        () => {
                          selected = 'All Topics';
                          handleTagFilter('All Topics');
                        }
                      "
                    >
                      Clear Filter
                    </Button>
                  </div>
                </div>

                <!-- Blog list section -->
                <div
                  v-if="!isLoading && displayPosts.length > 0"
                  class="blog-list"
                >
                  <PostCard
                    v-for="(post, index) in displayPosts"
                    :key="post.id"
                    :tag="post.Tags?.[0] || 'Blog'"
                    :titleText="post.title"
                    :author="getAuthorName(post)"
                    :excerpt="post.excerpt || ''"
                    :imageUrl="getImageUrl(post.image)"
                    :date="new Date(post.date)"
                    :tagIndex="index % 5"
                    :isFeatured="isFeaturedPost(post)"
                    variant="default"
                    :hoverable="true"
                    @click="navigateToBlogPost(post)"
                  />
                </div>

                <!-- No blogs found message -->
                <div v-else-if="!isLoading" class="no-blogs">
                  No blog posts found.
                </div>

                <!-- View all button -->
                <div
                  class="btn-mid"
                  v-if="allBlogsLoaded && !showSearchResults"
                >
                  <Button
                    variant="primary"
                    width="123px"
                    height="36px"
                    @click="navigateToAllPosts"
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
            as="h3"
            fontFamily="inter"
            size="lg"
            color="text-primary"
            weight="bold"
            align="center"
          >
            Our Contributors
          </Text>

          <!-- Collaborators rows -->
          <div
            v-for="(rowData, rowIndex) in collaborators"
            :key="rowIndex"
            class="collaborators-row"
          >
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
          href="/about#team-grid"
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
        <div v-if="latestEvent" class="upcoming-card-container">
          <UpcomingCard
            :title="latestEvent.title"
            :excerpt="latestEvent.description"
            :imageUrl="getImageUrl(latestEvent.thumbnail)"
            :onClick="() => handleEventClick(latestEvent)"
            :buttonLabel="isFutureEvent ? 'Register' : 'Watch'"
            :cardTitle="isFutureEvent ? 'Upcoming Event' : 'Featured Event'"
          />
        </div>

        <SignUpButtonWidget
          title="Sign Up for updates"
          placeholder="Enter your email"
          buttonLabel="Sign Up"
          backgroundColor="#F9F9F9"
        />

        <InnovateUsCard
          description="InnovateUS provides no-cost, at-your-own pace, and live learning. on data, digital, innovation, and AI skills for public service professionals like you."
          buttonLabel="Learn more"
          learnMoreUrl="https://innovate-us.org/"
        />
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import type { BlogPost, Event, NewsItem, WeeklyNews } from "@/types/index.ts";

// Constants
const DIRECTUS_URL = "https://content.thegovlab.com";
const DEFAULT_EDITION = "51";
const router = useRouter();

interface TaggedDataMap {
  [key: string]: BlogPost[];
}

// State
const { showSearchResults, resetSearch, searchQuery } = useSearchState();
const activeTab = ref(0);
const dataFetchError = ref<string | null>(null);
const blogsInitialized = ref(false);
const tagOptions = ref<string[]>(["All Topics"]);
const displayPosts = ref<BlogPost[]>([]);
const selected = ref<string>("All Topics");
const isMobile = ref(false);
const isLoadingState = ref(false);
const blogsFetched = ref(false);

// Use async data for initial fetch
const { data: blogList } = await useAsyncData("homepage-blogs", () =>
  fetchBlogData()
);

const { data: preloadedTags } = await useAsyncData(
  "homepage-tags",
  fetchAllUniqueTags
);
tagOptions.value = ["All Topics", ...(preloadedTags.value || [])];

const { data: featuredPost } = await useAsyncData(
  "homepage-featured",
  fetchFeaturedBlog
);
if (blogList.value) {
  if (featuredPost.value) {
    const rest = blogList.value.filter((p) => p.id !== featuredPost.value?.id);
    displayPosts.value = [featuredPost.value, ...rest];
  } else {
    displayPosts.value = blogList.value;
  }
}
watch(
  [blogList, featuredPost],
  ([blogs, featured]) => {
    if (blogs) {
      const rest = featured
        ? blogs.filter((p) => p.id !== featured?.id)
        : blogs;
      displayPosts.value = featured ? [featured, ...rest] : blogs;
      blogsFetched.value = true;
      blogsInitialized.value = true 
    }
  },
  { immediate: true }
);

// Create a local copy of featured blog for mutations
const featuredBlog = ref<BlogPost | null>(null);
watch(
  featuredPost,
  (newFeatured) => {
    featuredBlog.value = newFeatured || null;
  },
  { immediate: true }
);

const isFeaturedPost = (post: BlogPost | NewsItem) =>
  featuredBlog.value?.id === post.id;

// Computed properties based on our mutable state
const isLoading = computed(
  () => isLoadingState.value || !displayPosts.value.length
);
const allBlogsLoaded = computed(
  () => blogsFetched.value && displayPosts.value.length > 0
);

// Event data
const { data: homepageEventData, pending: isEventLoading } = await useAsyncData(
  "homepage-event",
  async () => {
    const upcoming = await fetchUpcomingEvent();
    return upcoming || (await fetchLatestPastEvent());
  }
);
const latestEvent = computed(() => homepageEventData.value);
const isFutureEvent = computed(() => {
  const event = latestEvent.value;
  return event ? new Date(event.date) > new Date() : true;
});

// Weekly news data
const { data: latestWeeklyNews } = await useAsyncData(
  "weekly-news",
  fetchLatestWeeklyNews
);

const editionNumber = computed(() =>
  latestWeeklyNews.value?.edition
    ? String(latestWeeklyNews.value.edition).replace(/\D/g, "")
    : "51"
);
const weeklyNewsUrl = computed(
  () => `/newsthatcaughtoureye/${editionNumber.value}`
);

const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 1050;
};

const { data: preloadedTaggedData } = await useAsyncData(
  "homepage-tagged-data",
  async () => {
    // Get all blogs and news items once
    const [allBlogs, allNewsItems] = await Promise.all([
      fetchAllBlogPosts(),
      fetchWeeklyNewsItems(),
    ]);
    
    // Use all available tags
    const allTags = preloadedTags.value || [];
    const taggedDataMap: TaggedDataMap = {};
    
    // Create a mapping of tags to posts for efficient lookup
    const tagToBlogsMap: Record<string, BlogPost[]> = {};
    
    // Index all blogs by their tags for faster filtering
    allBlogs.forEach(blog => {
      if (blog.Tags && Array.isArray(blog.Tags)) {
        blog.Tags.forEach(tag => {
          if (!tagToBlogsMap[tag]) {
            tagToBlogsMap[tag] = [];
          }
          tagToBlogsMap[tag].push(blog);
        });
      }
    });
    
    // Index all news items by category
    const categoryToNewsMap: Record<string, NewsItem[]> = {};
    allNewsItems.forEach(newsItem => {
      if (newsItem.category) {
        if (!categoryToNewsMap[newsItem.category]) {
          categoryToNewsMap[newsItem.category] = [];
        }
        categoryToNewsMap[newsItem.category].push(newsItem);
      }
    });
    
    // Process all tags
    for (const tag of allTags) {
      // Get blogs for this tag (already filtered)
      const filteredBlogs = tagToBlogsMap[tag] || [];
      
      // Get news items for this category (already filtered)
      const filteredNewsItems = categoryToNewsMap[tag] || [];
      
      // Convert news items to blog format
      const newsItemsAsBlogs = filteredNewsItems.map(
        (newsItem) => ({
          id: newsItem.id?.toString() || `news-${newsItem.url}`,
          title: newsItem.title || "Untitled",
          excerpt: newsItem.excerpt || "",
          date: newsItem.date || new Date().toISOString(),
          url: newsItem.url,
          Tags: newsItem.category ? [newsItem.category] : [],
        } as unknown as BlogPost)
      );
      
      // Combine and sort results
      const combinedResults = [...filteredBlogs, ...newsItemsAsBlogs];
      combinedResults.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Store top results for this tag
      taggedDataMap[tag] = combinedResults.slice(0, 7);
    }
    
    return taggedDataMap;
  }
);
// Collaborators data structure
const collaborators = [
  [
    {
      name: "Audrey Tang",
      title: "Taiwan's first Minister of Digital Affairs",
      imageUrl: "/images/Audrey_Tang.png",
    },
    {
      name: "Dane Gambrell",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Dane_Gambrell.png",
    },
  ],
  [
    {
      name: "Tiago C. Peixoto",
      title: "Senior Public Sector Specialist",
      imageUrl: "/images/Tiago_C_Peixoto.png",
    },
    {
      name: "Autumn Sloboda",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Autumn_Sloboda.png",
    },
  ],
  [
    {
      name: "Giulio Quaggiotto",
      title: "Head of UNDP's Strategic Innovation unit",
      imageUrl: "/images/Giulio_Quaggiotto.png",
    },
    {
      name: "Jacob Kemp",
      title: "AI & Social Impact Fellow",
      imageUrl: "/images/Jacob_Kemp.png",
    },
  ],
  [
    {
      name: "Seth Harris",
      title: "Senior Fellow at Burnes Center",
      imageUrl: "/images/Seth_Harris.png",
    },
    {
      name: "Hannah Hetzer",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Hannah_Hetzer.png",
    },
  ],
  [
    {
      name: "Bonnie McGilpin",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Bonnie_McGilpin.png",
    },
    {
      name: "Anirudh Dinesh",
      title: "Fellow at Burnes Center",
      imageUrl: "/images/Anirudh_Dinesh.png",
    },
  ],
];

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
    external: true,
  },
]);

const getAuthorName = (post: BlogPost | NewsItem): string => {
  if ("authors" in post && post.authors && post.authors.length > 0) {
    if (post.authors.length > 1) {
      const authorNames = post.authors
        .map((author) => {
          if (author.team_id) {
            return `${author.team_id.First_Name} ${author.team_id.Last_Name}`;
          }
          return null;
        })
        .filter(Boolean);

      if (authorNames.length > 0) {
        if (authorNames.length === 1) return authorNames[0] || "Unknown Author";
        const lastAuthor = authorNames.pop();
        return `${authorNames.join(", ")} and ${lastAuthor}`;
      }
      return "Reboot Democracy Team";
    }

    const author = post.authors[0]?.team_id;
    return author
      ? `${author.First_Name} ${author.Last_Name}`
      : "Reboot Democracy Team";
  } else if ("author" in post && post.author) {
    return post.author;
  }
  return "Reboot Democracy Team";
};

const navigateToBlogPost = (post: BlogPost | NewsItem) => {
  if ("slug" in post && post.slug) {
    resetSearch();
    router.push(`/blog/${post.slug}`);
  } else if ("url" in post && post.url) {
    window.open(post.url, "_blank");
  } else {
    console.error("Cannot navigate: Item has no slug or URL", post);
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
   resetSearch()
    if (!blogsInitialized.value) loadBlogData()
  }
};

const navigateToAllPosts = () => {
  const tag = selected.value !== "All Topics" ? selected.value : null;
  const routeQuery = tag
    ? { category: encodeURIComponent(tag), source: "all" }
    : { source: "all" };

  router.push({ path: "/blog", query: routeQuery });
};

// Data loading functions
const loadBlogData = async (force = false) => {
  if (blogsInitialized.value && !force) return;

  try {
    isLoadingState.value = true;

    // Get featured blog and all blogs
    const [featured, allBlogs] = await Promise.all([
      fetchFeaturedBlog(),
      fetchBlogData(),
    ]);

    featuredBlog.value = featured;

    // Exclude the featured blog if it exists in allBlogs
    const remainingBlogs = featured
      ? allBlogs.filter((blog) => blog.id !== featured.id)
      : allBlogs;

    displayPosts.value = featured
      ? [featured, ...remainingBlogs]
      : remainingBlogs;
    blogsFetched.value = true;
    blogsInitialized.value = true;
  } catch (error) {
    console.error("Failed to load blogs:", error);
    dataFetchError.value = "Failed to load blog posts. Please try again later.";
    displayPosts.value = [];
  } finally {
    isLoadingState.value = false;
  }
};

const handleTagFilter = async (selectedTag: string) => {
  selected.value = selectedTag;
  isLoadingState.value = true;

  try {
    if (selectedTag === "All Topics") {
      // Use original already-loaded blog data
      if (featuredPost.value) {
        const rest =
          blogList.value?.filter((p) => p.id !== featuredPost.value?.id) || [];
        displayPosts.value = [featuredPost.value, ...rest];
      } else {
        displayPosts.value = blogList.value || [];
      }
      blogsFetched.value = true;
      blogsInitialized.value = true;
    }
    // Use preloaded tag data if available
    else if (
      preloadedTaggedData.value &&
      preloadedTaggedData.value[selectedTag]
    ) {
      displayPosts.value = preloadedTaggedData.value[selectedTag];
    }
    // Fall back to API calls for non-preloaded tags
    else {
      // Your existing code for tag filtering - no changes here
      const [allBlogs, allNewsItems] = await Promise.all([
        fetchAllBlogPosts(),
        fetchWeeklyNewsItems(),
      ]);

      // Filter blog posts by tags
      const filteredBlogs = allBlogs.filter(
        (post) => post.Tags && post.Tags.includes(selectedTag)
      );

      // Filter news items by category
      const filteredNewsItems = allNewsItems.filter(
        (newsItem) => newsItem.category === selectedTag
      );

      const newsItemsAsBlogs = filteredNewsItems.map(
        (newsItem) =>
          ({
            id: newsItem.id?.toString() || `news-${newsItem.url}`,
            title: newsItem.title || "Untitled",
            excerpt: newsItem.excerpt || "",
            date: newsItem.date || new Date().toISOString(),
            url: newsItem.url,
            Tags: newsItem.category ? [newsItem.category] : [],
          } as unknown as BlogPost)
      );

      // Combine filtered blogs and news items
      const combinedResults = [...filteredBlogs, ...newsItemsAsBlogs];

      // Sort by date (newest first)
      combinedResults.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Check if featured blog has the selected tag
      const featured = await fetchFeaturedBlog();

      const blogs =
        featured && featured.Tags?.includes(selectedTag)
          ? [featured, ...combinedResults.slice(0, 6)]
          : combinedResults.slice(0, 7);

      displayPosts.value = blogs;
    }
  } catch (error) {
    console.error("Error filtering by tag:", error);
    displayPosts.value = [];
  } finally {
    isLoadingState.value = false;
  }
};

const loadInitialData = async () => {
  try {
    resetSearch();
    if (activeTab.value === 0 && !blogsInitialized.value) {
      await loadBlogData();
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  }
};

// Lifecycle hooks
onMounted(async () => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
  resetSearch();

  if (!blogsFetched.value && displayPosts.value.length === 0) {
    await loadBlogData();
  }
  if (tagOptions.value.length <= 1) {
    try {
      const uniqueTags = await fetchAllUniqueTags();
      tagOptions.value = ["All Topics", ...uniqueTags];
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", checkIfMobile);
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
