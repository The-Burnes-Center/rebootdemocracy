<template>
  <div class="all-posts-page">
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />
    <section class="all-posts-page-layout">
      <article
        class="all-posts-left-content"
        :class="{ 'search-active': showSearchResults }"
      >
        <!-- Show GlobalSearch when searching -->
        <GlobalSearch v-if="showSearchResults" />

        <!-- Otherwise show regular posts content -->
        <template v-else>
          <div v-if="isPostsLoading" class="loading">Loading content...</div>

          <div class="mobile-category-and-authors">
            <!-- Categories section with toggle -->
            <div class="section-header" @click="toggleCategoriesVisible">
              <Text
                as="h2"
                fontFamily="habibi"
                size="lg"
                color="text-primary"
                weight="bold"
                align="left"
              >
                Category
              </Text>
              <div class="toggle-icon">
                <i
                  :class="
                    isCategoriesVisible
                      ? 'icon-chevron-up'
                      : 'icon-chevron-down'
                  "
                ></i>
              </div>
            </div>

            <!-- Display list of categories with post counts (togglable) -->
            <div
              v-if="isTagsLoading && isCategoriesVisible"
              class="loading-tags"
            >
              Loading categories...
            </div>
            <div v-else-if="isCategoriesVisible" class="category-list">
              <div
                v-for="tag in tags"
                :key="tag.id"
                class="category-item"
                :class="{
                  'category-item--active': selectedCategory === tag.name,
                }"
                @click="selectCategory(tag.name)"
              >
                <ListCategory :title="tag.name" :number="tag.count" />
              </div>
            </div>

            <!-- Authors section with toggle -->
            <div class="section-header" @click="toggleAuthorsVisible">
              <Text
                as="h2"
                fontFamily="habibi"
                size="lg"
                color="text-primary"
                weight="bold"
                align="left"
                class="section-title"
              >
                Authors
              </Text>
              <div class="toggle-icon">
                <i
                  :class="
                    isAuthorsVisible ? 'icon-chevron-up' : 'icon-chevron-down'
                  "
                ></i>
              </div>
            </div>

            <!-- Display list of authors with post counts (togglable) -->
            <div
              v-if="isAuthorsLoading && isAuthorsVisible"
              class="loading-tags"
            >
              Loading authors...
            </div>
            <div v-else-if="isAuthorsVisible">
              <div
                v-for="author in filteredAuthors"
                :key="author.id"
                class="author-item"
                :class="{
                  'author-item--active': selectedAuthor === author.name,
                }"
                @click="selectAuthor(author.name)"
              >
                <ListCategory :title="author.name" :number="author.count" />
              </div>
            </div>
          </div>

          <!-- Results counter and filter controls in a fixed-height container -->
          <div class="results-and-filter">
            <div class="results-count">
              <Text
                as="span"
                fontFamily="inria"
                size="base"
                color="text-primary"
                weight="medium"
              >
                Showing {{ displayedPosts.length }} of
                {{ filteredPosts.length }} results
                <template v-if="selectedCategory">
                  in category "{{ selectedCategory }}"
                </template>
                <template v-if="selectedAuthor">
                  by author "{{ selectedAuthor }}"
                </template>
              </Text>
            </div>

            <div
              v-if="selectedCategory || selectedAuthor"
              class="filter-actions"
            >
              <Button variant="secondary" size="small" @click="clearFilters">
                Clear Filter
              </Button>
            </div>
          </div>

          <!-- Display filtered blogs when loaded -->
          <div
            v-if="!isPostsLoading && displayedPosts.length > 0"
            class="blog-list"
          >
            <div class="blogcard-grid-wrapper">
              <BlogCard
                v-for="post in displayedPosts"
                :key="getPostKey(post)"
                :title="getPostTitle(post)"
                :excerpt="getPostExcerpt(post)"
                :imageUrl="
                  'image' in post && post.image?.id
                    ? getImageUrl(post.image)
                    : '/images/exampleImage.png'
                "
                :tag="getPostTag(post)"
                :author="getAuthorName(post)"
                :date="getPostDate(post)"
                @click="handlePostClick(post)"
              />
            </div>
          </div>

          <!-- No blogs found message -->
          <div v-else-if="!isPostsLoading" class="no-blogs">
            <span v-if="selectedCategory">
              No posts found in category "{{ selectedCategory }}"
            </span>
            <span v-else-if="selectedAuthor">
              No posts found by author "{{ selectedAuthor }}"
            </span>
            <span v-else>No content found.</span>
          </div>

          <!-- Show More button appears when there are more posts to load -->
          <div v-if="!isPostsLoading && hasMorePosts" class="btn-mid">
            <Button
              variant="secondary"
              width="150px"
              height="40px"
              @click="loadMorePosts"
            >
              Show More
            </Button>
          </div>
        </template>
      </article>

      <aside class="all-posts-right-content">
        <div class="desktop-category-and-authors">
          <!-- Categories section -->
          <Text
            as="h2"
            fontFamily="inria"
            size="lg"
            color="text-primary"
            weight="bold"
            align="left"
          >
            Category
          </Text>

          <!-- Display list of categories with post counts -->
          <div v-if="isTagsLoading" class="loading-tags">
            Loading categories...
          </div>
          <div v-else class="category-list">
            <div
              v-for="tag in tags"
              :key="tag.id"
              class="category-item"
              :class="{
                'category-item--active': selectedCategory === tag.name,
              }"
              @click="selectCategory(tag.name)"
            >
              <ListCategory :title="tag.name" :number="tag.count" />
            </div>
          </div>

          <!-- Authors section -->
          <Text
            as="h2"
            fontFamily="habibi"
            size="lg"
            color="text-primary"
            weight="bold"
            align="left"
            class="section-title"
          >
            Authors
          </Text>

          <!-- Display list of authors with post counts -->
          <div v-if="isAuthorsLoading" class="loading-tags">
            Loading authors...
          </div>
          <div v-else>
            <div
              v-for="author in filteredAuthors"
              :key="author.id"
              class="author-item"
              :class="{ 'author-item--active': selectedAuthor === author.name }"
              @click="selectAuthor(author.name)"
            >
              <ListCategory :title="author.name" :number="author.count" />
            </div>
          </div>
        </div>

        <!-- Event section with loading state -->
        <!-- <div v-if="isEventLoading" class="loading">Loading event...</div>
        <UpcomingCard
          v-if="latestEvent"
          :title="latestEvent.title"
          :excerpt="latestEvent.description"
          :imageUrl="getImageUrl(latestEvent.thumbnail)"
          :onClick="() => handleEventClick(latestEvent)"
          :buttonLabel="isFutureEvent ? 'Register' : 'Watch'"
          :cardTitle="isFutureEvent ? 'Upcoming Event' : 'Featured Event'"
        /> -->

        <SignUpButtonWidget
          title="Sign Up for updates"
          placeholder="Enter your email"
          buttonLabel="Sign Up"
          backgroundColor="#F9F9F9"
        />
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";
import type { BlogPost, Event } from "@/types/index.ts";
import type { NewsItem } from "@/types/RawSearchResultItem";

const props = defineProps<{ initialCategory?: string }>();

//meta information
useHead({
  title: "RebootDemocracy.AI",
  meta: [
    { name: "title", content: "RebootDemocracy.AI" },
    { property: "og:title", content: "RebootDemocracy.AI" },
    {
      property: "og:description",
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 
1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to "do democracy" in practice.
Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`,
    },
    {
      property: "og:image",
      content:
        "https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3.png",
    },
    { property: "twitter:title", content: "RebootDemocracy.AI" },
    {
      property: "twitter:description",
      content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 
1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to "do democracy" in practice.
Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`,
    },
    {
      property: "twitter:image",
      content:
        "https://thegovlab-files.nyc3.cdn.digitaloceanspaces.com/thegovlab-directus9/uploads/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3.png",
    },
    { property: "twitter:card", content: "summary_large_image" },
  ],
});

// Constants
const DIRECTUS_URL = "https://burnes-center.directus.app/";
const POSTS_PER_PAGE = 15;
const router = useRouter();
const route = useRoute();

// State management
const { showSearchResults, resetSearch } = useSearchState();

// Toggle state for mobile category/authors
const isCategoriesVisible = ref(false);
const isAuthorsVisible = ref(false);
const isMobile = ref(false);
const selectedCategory = ref<string | null>(null);
const selectedAuthor = ref<string | null>(null);
const currentPage = ref(1);

// Toggle functions
const toggleCategoriesVisible = () => {
  isCategoriesVisible.value = !isCategoriesVisible.value;
};

const toggleAuthorsVisible = () => {
  isAuthorsVisible.value = !isAuthorsVisible.value;
};

// Interfaces
interface Category {
  id: string;
  name: string;
  count: number;
}

interface Author {
  id: string;
  name: string;
  count: number;
}

const getAuthorName = (post: BlogPost | NewsItem): string => {
  if (
    "authors" in post &&
    post.authors &&
    Array.isArray(post.authors) &&
    post.authors.length > 0
  ) {
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
        if (authorNames.length === 1) return authorNames[0];
        const lastAuthor = authorNames.pop();
        return `${authorNames.join(", ")} and ${lastAuthor}`;
      }
      return "Reboot Democracy Team";
    }

    const author = post.authors[0]?.team_id;
    return author
      ? `${author.First_Name} ${author.Last_Name}`
      : "Reboot Democracy Team";
  } else if (
    "authors" in post &&
    post.authors &&
    typeof post.authors === "string"
  ) {
    return post.authors;
  } else if ("author" in post && post.author) {
    return post.author;
  }

  return "Reboot Democracy Team";
};

// Data processing functions
const extractTagsWithCounts = (posts: (BlogPost | NewsItem)[]): Category[] => {
  if (!posts || posts.length === 0) return [];

  const tagCounts = new Map<string, number>();

  posts.forEach((post) => {
    if ("Tags" in post && Array.isArray(post.Tags)) {
      post.Tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    } else if ("category" in post && post.category) {
      tagCounts.set(post.category, (tagCounts.get(post.category) || 0) + 1);
    }
  });

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ id: name, name, count }))
    .sort((a, b) => b.count - a.count);
};

const extractAuthorsWithCounts = (posts: (BlogPost | NewsItem)[]): Author[] => {
  try {
    if (!posts || posts.length === 0) return [];

    const authorCounts = new Map<string, number>();

    posts.forEach((post, index) => {
      try {
        if (!post) return;

        const authorName = getAuthorName(post);

        // Only count meaningful author names
        if (
          authorName &&
          authorName !== "Unknown Author" &&
          authorName !== "Reboot Democracy Team" &&
          authorName.trim() !== ""
        ) {
          authorCounts.set(authorName, (authorCounts.get(authorName) || 0) + 1);
        }
      } catch (postError) {
        console.error(`Error processing post ${index}:`, postError, post);
      }
    });

    return Array.from(authorCounts.entries())
      .map(([name, count]) => ({ id: name, name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error in extractAuthorsWithCounts:", error);
    return [];
  }
};

const { data: allPostsData, pending: isPostsLoading } = await useAsyncData(
  "all-blog-posts",
  async () => {
    const [blogPosts, newsItems] = await Promise.all([
      fetchAllBlogPosts(),
      fetchWeeklyNewsItems(),
    ]);

    const sortDesc = (a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime();

    const newsSorted = [...newsItems].sort(sortDesc);

    return [...blogPosts, ...newsSorted];
  },
  { server: true }
);

// Prefetch tags data
const { data: tagsData, pending: isTagsLoading } = await useAsyncData(
  "all-blog-tags",
  async () => {
    try {
      return extractTagsWithCounts(allPostsData.value || []);
    } catch (error) {
      console.error("Error processing tags:", error);
      return [];
    }
  },
  {
    watch: [allPostsData],
  }
);

// Prefetch authors data
const { data: authorsData, pending: isAuthorsLoading } = await useAsyncData(
  "all-blog-authors",
  async () => {
    try {
      return extractAuthorsWithCounts(allPostsData.value || []);
    } catch (error) {
      console.error("Error processing authors:", error);
      return [];
    }
  },
  {
    watch: [allPostsData],
  }
);

// Prefetch event data
const { data: eventData, pending: isEventLoading } = await useAsyncData(
  "all-blog-event",
  async () => {
    try {
      // Try to get upcoming event first
      let event = await fetchUpcomingEvent();
      let isFutureEvent = true;

      if (!event) {
        // If no upcoming event, get the latest past event
        event = await fetchLatestPastEvent();
        isFutureEvent = false;
      }

      return { event, isFutureEvent };
    } catch (error) {
      console.error("Error fetching event:", error);
      return { event: null, isFutureEvent: false };
    }
  }
);

// Computed properties from prefetched data
const allPosts = computed(() => allPostsData.value || []);
const tags = computed(() => tagsData.value || []);
const authors = computed(() => authorsData.value || []);

const filteredAuthors = computed(() =>
  authors.value.filter((author) => author.count > 1)
);

// Filtered posts based on selected category/author
const filteredPosts = computed(() => {
  let filtered = allPosts.value;

  if (selectedCategory.value) {
    filtered = filtered.filter((post) => {
      if ("Tags" in post && Array.isArray(post.Tags)) {
        return post.Tags.includes(selectedCategory.value as string);
      } else if ("category" in post && post.category) {
        return post.category === selectedCategory.value;
      }
      return false;
    });
  }

  if (selectedAuthor.value) {
    filtered = filtered.filter(
      (post) => getAuthorName(post) === selectedAuthor.value
    );
  }

  return filtered;
});

// Displayed posts (paginated)
const displayedPosts = computed(() => {
  const endIndex = currentPage.value * POSTS_PER_PAGE;
  return filteredPosts.value.slice(0, endIndex);
});

const hasMorePosts = computed(
  () => displayedPosts.value.length < filteredPosts.value.length
);

// Helper functions for handling both blog posts and news items
const getPostKey = (post: BlogPost | NewsItem): string => {
  if ("id" in post) {
    return `blog-${post.id}`;
  } else {
    return `news-${post.url}`;
  }
};

const getPostTag = (post: BlogPost | NewsItem): string => {
  if ("Tags" in post && Array.isArray(post.Tags) && post.Tags.length > 0) {
    return post.Tags[0];
  } else if ("category" in post && post.category) {
    return post.category;
  }
  return "Blog";
};

const getPostTitle = (post: BlogPost | NewsItem): string => {
  if ("title" in post && post.title) {
    return post.title;
  }
  return "Untitled";
};

const getPostExcerpt = (post: BlogPost | NewsItem): string => {
  if ("excerpt" in post && post.excerpt) {
    return post.excerpt;
  }
  return "";
};

const getPostImage = (post: BlogPost | NewsItem): any => {
  if ("image" in post && post.image) {
    return post.image;
  }
  return null;
};

const getPostDate = (post: BlogPost | NewsItem): Date => {
  if ("date" in post && post.date) {
    return new Date(post.date);
  }
  return new Date();
};

// Navigation and event handlers
const handlePostClick = (post: BlogPost | NewsItem): void => {
  if ("slug" in post && post.slug) {
    resetSearch();
    router.push(`/blog/${post.slug}`);
  } else if ("url" in post && post.url) {
    window.location.href = post.url;
  } else {
    console.error("Cannot navigate: Post has no slug or URL", post);
  }
};

const handleEventClick = (event: Event | null) => {
  if (event?.link) {
    window.location.href = event.link;
  }
};

// Pagination
const loadMorePosts = () => {
  if (!hasMorePosts.value) return;
  currentPage.value++;
};

// Filter management
const selectCategory = (category: string) => {
  selectedAuthor.value = null;
  selectedCategory.value = category;
  currentPage.value = 1;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const selectAuthor = (author: string) => {
  selectedCategory.value = null;
  selectedAuthor.value = author;
  currentPage.value = 1;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const clearFilters = () => {
  selectedCategory.value = null;
  selectedAuthor.value = null;
  currentPage.value = 1;
};

// Helper function for responsive design
const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 1050;
};

// Lifecycle hooks
onMounted(() => {
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);

  // Prefer path param; fall back to ?category= for legacy links
  const categoryParam =
    props.initialCategory ?? (route.query.category as string | undefined);
  if (categoryParam) {
    const categoryName = decodeURIComponent(categoryParam);
    const found = tags.value.find(
      (t) => t.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (found) selectedCategory.value = found.name;
  }

  const authorParam = route.query.author as string | undefined;
  if (authorParam) {
    const foundAuthor = authors.value.find(
      (author) => author.name.toLowerCase() === authorParam.toLowerCase()
    );

    if (foundAuthor) {
      selectedAuthor.value = foundAuthor.name;
    }
  }
});

onBeforeRouteLeave((to, from, next) => {
  resetSearch();
  next();
});

onUnmounted(() => {
  window.removeEventListener("resize", checkIfMobile);
});
</script>
