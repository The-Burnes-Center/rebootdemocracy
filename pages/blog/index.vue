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
          <div v-if="isLoading" class="loading">Loading content...</div>

          <div class="mobile-category-and-authors">
            <!-- Categories section with toggle -->
            <div class="section-header" @click="toggleCategoriesVisible">
              <Text
                as="h2"
                fontFamily="inter"
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
                fontFamily="inter"
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
                fontFamily="inter"
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
          <div v-if="!isLoading && displayedPosts.length > 0" class="blog-list">
            <PostCard
              v-for="(post, index) in displayedPosts"
              :key="getPostKey(post)"
              :tag="getPostTag(post)"
              :titleText="getPostTitle(post)"
              :author="getAuthorName(post)"
              :excerpt="getPostExcerpt(post)"
              :imageUrl="getImageUrl(getPostImage(post))"
              :date="getPostDate(post)"
              :tagIndex="index % 5"
              variant="default"
              :hoverable="true"
              @click="handlePostClick(post)"
            />
          </div>

          <!-- No blogs found message -->
          <div v-else-if="!isLoading" class="no-blogs">
            <span v-if="selectedCategory">
              No posts found in category "{{ selectedCategory }}"
            </span>
            <span v-else-if="selectedAuthor">
              No posts found by author "{{ selectedAuthor }}"
            </span>
            <span v-else>No content found.</span>
          </div>

          <!-- Show More button appears when there are more posts to load -->
          <div v-if="!isLoading && hasMorePosts" class="btn-mid">
            <Button
              variant="primary"
              width="140px"
              height="36px"
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
            fontFamily="inter"
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
            fontFamily="inter"
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
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";
import type { BlogPost, Event, WeeklyNews } from "@/types/index.ts";
import type { NewsItem } from "@/types/RawSearchResultItem";

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
const DIRECTUS_URL = "https://content.thegovlab.com";
const POSTS_PER_PAGE = 7;
const router = useRouter();
const route = useRoute();

// State management
const { showSearchResults, resetSearch } = useSearchState();
const isFutureEvent = ref(true);

// Toggle state for mobile category/authors
const isCategoriesVisible = ref(false); // Initially collapsed on mobile
const isAuthorsVisible = ref(false); // Initially collapsed on mobile

// Toggle functions
const toggleCategoriesVisible = () => {
  isCategoriesVisible.value = !isCategoriesVisible.value;
};

const toggleAuthorsVisible = () => {
  isAuthorsVisible.value = !isAuthorsVisible.value;
};

// Data state
const allPosts = ref<(BlogPost | NewsItem)[]>([]);
const filteredPosts = ref<(BlogPost | NewsItem)[]>([]);
const displayedPosts = ref<(BlogPost | NewsItem)[]>([]);
const tags = ref<Category[]>([]);
const authors = ref<Author[]>([]);
const latestEvent = ref<Event | null>(null);

// UI state
const isLoading = ref(true);
const isTagsLoading = ref(true);
const isAuthorsLoading = ref(true);
const isEventLoading = ref(true);
const dataFetchError = ref<string | null>(null);
const selectedCategory = ref<string | null>(null);
const selectedAuthor = ref<string | null>(null);
const currentPage = ref(1);

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

const handleEventClick = (event: Event | null) => {
  if (event?.link) {
    window.open(event.link, "_blank");
  }
};

// Computed properties
const hasMorePosts = computed(
  () => displayedPosts.value.length < filteredPosts.value.length
);

const filteredAuthors = computed(() =>
  authors.value.filter((author) => author.count > 1)
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
  } else if ("author" in post && post.author) {
    return post.author;
  }
  return "Reboot Democracy Team";
};

// Navigation
const handlePostClick = (post: BlogPost | NewsItem): void => {
  if ("slug" in post && post.slug) {
    resetSearch();
    router.push(`/blog/${post.slug}`);
  } else if ("url" in post && post.url) {
    window.open(post.url, "_blank");
  } else {
    console.error("Cannot navigate: Post has no slug or URL", post);
  }
};

// Pagination
const loadMorePosts = () => {
  if (!hasMorePosts.value) return;

  currentPage.value++;
  const startIndex = (currentPage.value - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;

  const newPosts = filteredPosts.value.slice(startIndex, endIndex);
  displayedPosts.value = [...displayedPosts.value, ...newPosts];
};

// Filter management
const updateFilteredPosts = () => {
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

  filteredPosts.value = filtered;
  currentPage.value = 1;
  displayedPosts.value = filteredPosts.value.slice(0, POSTS_PER_PAGE);
};

const selectCategory = (category: string) => {
  selectedAuthor.value = null;
  selectedCategory.value = category;
  updateFilteredPosts();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const selectAuthor = (author: string) => {
  selectedCategory.value = null;
  selectedAuthor.value = author;
  updateFilteredPosts();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const clearFilters = () => {
  selectedCategory.value = null;
  selectedAuthor.value = null;
  filteredPosts.value = allPosts.value;
  currentPage.value = 1;
  displayedPosts.value = allPosts.value.slice(0, POSTS_PER_PAGE);
};

// Data fetching
const fetchAllBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const { directus, readItems } = useDirectusClient();

    const filter = {
      _and: [
        { status: { _eq: "published" } },
        { date: { _lte: "$NOW(-5 hours)" } },
      ],
    };

    const response = await directus.request(
      readItems("reboot_democracy_blog", {
        limit: -1,
        sort: ["-date"],
        fields: [
          "*.*",
          "authors.team_id.*",
          "authors.team_id.Headshot.*",
          "image.*",
        ],
        filter,
      })
    );

    return response as BlogPost[];
  } catch (error) {
    console.error("Error fetching all blog posts:", error);
    return [];
  }
};

// Fetch weekly news items
const fetchWeeklyNewsItems = async (): Promise<NewsItem[]> => {
  try {
    const { directus, readItems } = useDirectusClient();

    // Fetch all weekly news entries
    const weeklyNewsEntries = await directus.request(
      readItems("reboot_democracy_weekly_news", {
        limit: -1,
        sort: ["-id"],
        fields: ["id", "items.reboot_democracy_weekly_news_items_id.*"],
        filter: {
          status: { _eq: "published" },
        },
      })
    );

    if (
      !weeklyNewsEntries ||
      !Array.isArray(weeklyNewsEntries) ||
      weeklyNewsEntries.length === 0
    ) {
      return [];
    }

    // Collect all news items from all entries
    const allNewsItems: NewsItem[] = [];

    weeklyNewsEntries.forEach((newsEntry) => {
      if (newsEntry.items && Array.isArray(newsEntry.items)) {
        const itemsFromThisEntry = newsEntry.items
          .map((item: any) => {
            const newsItem = item.reboot_democracy_weekly_news_items_id;
            if (!newsItem) return null;

            return {
              title: newsItem.title,
              excerpt: newsItem.excerpt,
              author: newsItem.author,
              category: newsItem.category,
              date: newsItem.date,
              url: newsItem.url,
            };
          })
          .filter(Boolean); // Remove any null items

        allNewsItems.push(...itemsFromThisEntry);
      }
    });

    return allNewsItems;
  } catch (error) {
    console.error("Error fetching weekly news items:", error);
    return [];
  }
};

// Data processing
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
  if (!posts || posts.length === 0) return [];

  const authorCounts = new Map<string, number>();

  // Only count authors from blog posts, not from weekly news items
  posts.forEach((post) => {
    if ("authors" in post && post.authors) {
      const authorName = getAuthorName(post);
      if (authorName !== "Unknown Author") {
        authorCounts.set(authorName, (authorCounts.get(authorName) || 0) + 1);
      }
    }
  });

  return Array.from(authorCounts.entries())
    .map(([name, count]) => ({ id: name, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Main data loading
const fetchAllData = async () => {
  try {
    isLoading.value = true;
    isTagsLoading.value = true;
    isAuthorsLoading.value = true;

    // Fetch blogs and news items in parallel
    const [blogPosts, newsItems] = await Promise.all([
      fetchAllBlogPosts(),
      fetchWeeklyNewsItems(),
    ]);

    // Combine blog posts and news items
    allPosts.value = [...blogPosts, ...newsItems];
    filteredPosts.value = allPosts.value;
    displayedPosts.value = allPosts.value.slice(0, POSTS_PER_PAGE);

    // Extract tags and authors
    tags.value = extractTagsWithCounts(allPosts.value);
    authors.value = extractAuthorsWithCounts(allPosts.value);

    return { posts: allPosts.value, tags: tags.value, authors: authors.value };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { posts: [], tags: [], authors: [] };
  } finally {
    isLoading.value = false;
    isTagsLoading.value = false;
    isAuthorsLoading.value = false;
  }
};

const loadInitialData = async () => {
  resetSearch();

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
    await fetchAllData();
  } catch (error) {
    console.error("Error loading initial data:", error);
    dataFetchError.value = "Failed to load content. Please try again later.";
  } finally {
    isEventLoading.value = false;
  }
};

onMounted(() => {
  loadInitialData().then(() => {
    // Check for category query parameter
    const categoryParam = route.query.category as string | undefined;
    const sourceParam = route.query.source as string | undefined;

    if (categoryParam) {
      // Find the matching category from the loaded tags
      const categoryName = decodeURIComponent(categoryParam);
      const foundCategory = tags.value.find(
        (tag) =>
          tag.name === categoryName ||
          tag.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (foundCategory) {
        selectedCategory.value = foundCategory.name;

        // If source=all, we want to include both blogs and news items
        if (sourceParam === "all") {
          // We don't need to fetch again as fetchAllData() already did this
          // Just make sure the filtering logic in updateFilteredPosts includes news items
          updateFilteredPosts();
        } else {
          // Regular filtering (current behavior)
          updateFilteredPosts();
        }
      }
    }

    // Keep your existing author parameter handling
    const authorParam = route.query.author as string | undefined;
    if (authorParam) {
      const foundAuthor = authors.value.find(
        (author) => author.name.toLowerCase() === authorParam.toLowerCase()
      );

      if (foundAuthor) {
        selectedAuthor.value = foundAuthor.name;
        updateFilteredPosts();
      }
    }
  });
});

onBeforeRouteLeave((to, from, next) => {
  resetSearch();
  next();
});

// Watch for filter changes
watch([selectedCategory, selectedAuthor], () => {
  updateFilteredPosts();
});
</script>
