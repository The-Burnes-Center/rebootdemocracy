<template>
  <div class="all-posts-page">
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />

    <section class="all-posts-page-layout">
      <main
        id="main-content"
        class="all-posts-left-content"
        :class="{ 'search-active': showSearchResults }"
        role="main"
        aria-label="Blog posts and articles"
      >
        <!-- Show GlobalSearch when searching -->
        <div v-if="showSearchResults" role="search" aria-label="Search results">
          <GlobalSearch />
        </div>

        <!-- Otherwise show regular posts content -->
        <template v-else>
          <div
            v-if="isPostsLoading"
            class="loading"
            role="status"
            aria-live="polite"
            aria-label="Loading blog content"
          >
            <span class="sr-only">Loading content, please wait</span>
            Loading content...
          </div>

          <!-- Mobile category and authors section -->
          <section
            class="mobile-category-and-authors"
            aria-label="Filter options"
          >
            <!-- Categories section with toggle -->
            <div class="section-header">
              <button
                @click="toggleCategoriesVisible"
                @keydown="handleKeydown($event, toggleCategoriesVisible)"
                :aria-expanded="isCategoriesVisible"
                :aria-controls="'categories-list'"
                aria-label="Toggle categories list"
                class="toggle-button"
                type="button"
              >
                <Text
                  as="h2"
                  fontFamily="merriweather"
                  size="lg"
                  color="text-primary"
                  weight="bold"
                  align="left"
                >
                  Category
                </Text>
                <div class="toggle-icon" aria-hidden="true">
                  <i
                    :class="
                      isCategoriesVisible
                        ? 'icon-chevron-up'
                        : 'icon-chevron-down'
                    "
                  ></i>
                </div>
              </button>
            </div>

            <!-- Display list of categories with post counts (togglable) -->
            <div
              v-if="isTagsLoading && isCategoriesVisible"
              class="loading-tags"
              role="status"
              aria-live="polite"
            >
              <span class="sr-only">Loading categories, please wait</span>
              Loading categories...
            </div>
            <div
              v-else-if="isCategoriesVisible"
              id="categories-list"
              class="category-list"
              role="list"
              aria-label="Categories"
            >
              <button
                v-for="tag in tags"
                :key="tag.id"
                class="category-item"
                :class="{
                  'category-item--active': selectedCategory === tag.name,
                }"
                @click="selectCategory(tag.name)"
                @keydown="handleKeydown($event, () => selectCategory(tag.name))"
                role="listitem"
                :aria-pressed="selectedCategory === tag.name"
                :aria-label="`Filter by category ${tag.name}, ${tag.count} posts`"
                type="button"
              >
                <ListCategory :title="tag.name" :number="tag.count" />
              </button>
            </div>

            <!-- Authors section with toggle -->
            <div class="section-header">
              <button
                @click="toggleAuthorsVisible"
                @keydown="handleKeydown($event, toggleAuthorsVisible)"
                :aria-expanded="isAuthorsVisible"
                :aria-controls="'authors-list'"
                aria-label="Toggle authors list"
                class="toggle-button"
                type="button"
              >
                <Text
                  as="h2"
                  fontFamily="merriweather"
                  size="lg"
                  color="text-primary"
                  weight="bold"
                  align="left"
                  class="section-title"
                >
                  Authors
                </Text>
                <div class="toggle-icon" aria-hidden="true">
                  <i
                    :class="
                      isAuthorsVisible ? 'icon-chevron-up' : 'icon-chevron-down'
                    "
                  ></i>
                </div>
              </button>
            </div>

            <!-- Display list of authors with post counts (togglable) -->
            <div
              v-if="isAuthorsLoading && isAuthorsVisible"
              class="loading-tags"
              role="status"
              aria-live="polite"
            >
              <span class="sr-only">Loading authors, please wait</span>
              Loading authors...
            </div>
            <div
              v-else-if="isAuthorsVisible"
              id="authors-list"
              role="list"
              aria-label="Authors"
            >
              <button
                v-for="author in filteredAuthors"
                :key="author.id"
                class="author-item"
                :class="{
                  'author-item--active': selectedAuthor === author.name,
                }"
                @click="selectAuthor(author.name)"
                @keydown="
                  handleKeydown($event, () => selectAuthor(author.name))
                "
                role="listitem"
                :aria-pressed="selectedAuthor === author.name"
                :aria-label="`Filter by author ${author.name}, ${author.count} posts`"
                type="button"
              >
                <ListCategory :title="author.name" :number="author.count" />
              </button>
            </div>
          </section>

          <!-- Results counter and filter controls -->
          <section
            class="results-and-filter"
            aria-label="Filter results and actions"
          >
            <div class="results-count" role="status" aria-live="polite">
              <Text
                as="h2"
                fontFamily="merriweather"
                size="lg"
                color="text-primary"
                weight="bold"
                align="left"
                :aria-label="`Showing ${displayedPosts.length} of ${
                  filteredPosts.length
                } results${
                  selectedCategory ? ` in category ${selectedCategory}` : ''
                }${selectedAuthor ? ` by author ${selectedAuthor}` : ''}`"
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
              <Button
                variant="secondary"
                size="small"
                @click="clearFilters"
                @keydown="handleKeydown($event, clearFilters)"
                aria-label="Clear all active filters"
              >
                Clear Filter
              </Button>
            </div>
          </section>

          <!-- Display filtered blogs when loaded -->
          <section
            v-if="
              !isPostsLoading &&
              !isFilteringByAuthor &&
              displayedPosts.length > 0
            "
            class="blog-list"
            role="region"
            aria-label="Blog posts"
          >
            <div
              id="blogcard-grid-wrapper"
              class="blogcard-grid-wrapper"
              role="list"
            >
              <article
                v-for="post in displayedPosts"
                :key="getPostKey(post)"
                role="listitem"
                tabindex="0"
                @click="handlePostClick(post)"
                @keydown="handleKeydown($event, () => handlePostClick(post))"
                :aria-label="`Article: ${getPostTitle(post)} by ${getAuthorName(
                  post
                )}, published ${getPostDate(post).toLocaleDateString()}`"
                class="blog-post-item"
              >
                <BlogCard
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
                />
              </article>
            </div>
          </section>

          <!-- Loading state when filtering by author -->
          <div
            v-else-if="isFilteringByAuthor"
            class="loading"
            role="status"
            aria-live="polite"
            :aria-label="`Loading posts by ${selectedAuthor}`"
          >
            <span class="sr-only"
              >Loading posts by {{ selectedAuthor }}, please wait</span
            >
            Loading posts by {{ selectedAuthor }}...
          </div>

          <!-- No blogs found message -->
          <div
            v-else-if="!isPostsLoading && !isFilteringByAuthor"
            class="no-blogs"
            role="status"
            aria-live="polite"
          >
            <span v-if="selectedCategory">
              No posts found in category "{{ selectedCategory }}"
            </span>
            <span v-else-if="selectedAuthor">
              No posts found by author "{{ selectedAuthor }}"
            </span>
            <span v-else>No content found.</span>
          </div>

          <!-- Show More button -->
          <div v-if="!isPostsLoading && hasMorePosts" class="btn-mid">
            <Button
              variant="secondary"
              width="160px"
              height="40px"
              @click="loadMorePosts"
              @keydown="handleKeydown($event, loadMorePosts)"
              :aria-label="`Load more posts. Currently showing ${displayedPosts.length} of ${filteredPosts.length} posts`"
            >
              Show More
            </Button>
          </div>
        </template>
      </main>

      <aside
        class="all-posts-right-content"
        role="complementary"
        aria-label="Sidebar filters and newsletter signup"
      >
        <nav
          class="desktop-category-and-authors"
          aria-label="Filter by category and author"
        >
          <!-- Categories section -->
          <h2
            id="categories-heading"
            style="
              font-family: var(--font-sora);
              font-size: 1.125rem;
              color: #000;
              font-weight: bold;
              text-align: left;
              margin-bottom: 16px;
            "
          >
            Category
          </h2>

          <!-- Display list of categories with post counts -->
          <div
            v-if="isTagsLoading"
            class="loading-tags"
            role="status"
            aria-live="polite"
          >
            <span class="sr-only">Loading categories, please wait</span>
            Loading categories...
          </div>
          <div
            v-else
            class="category-list"
            role="list"
            aria-labelledby="categories-heading"
          >
            <button
              v-for="tag in tags"
              :key="tag.id"
              class="category-item"
              :class="{
                'category-item--active': selectedCategory === tag.name,
              }"
              @click="selectCategory(tag.name)"
              @keydown="handleKeydown($event, () => selectCategory(tag.name))"
              role="listitem"
              :aria-pressed="selectedCategory === tag.name"
              :aria-label="`Filter by category ${tag.name}, ${tag.count} posts`"
              type="button"
            >
              <ListCategory :title="tag.name" :number="tag.count" />
            </button>
          </div>

          <!-- Authors section -->
          <h2
            id="authors-heading"
            style="
              font-family: var(--font-sora);
              font-size: 1.125rem;
              color: #000;
              font-weight: bold;
              text-align: left;
              margin: 32px 0 16px 0;
            "
          >
            Authors
          </h2>

          <!-- Display list of authors with post counts -->
          <div
            v-if="isAuthorsLoading"
            class="loading-tags"
            role="status"
            aria-live="polite"
          >
            <span class="sr-only">Loading authors, please wait</span>
            Loading authors...
          </div>
          <div v-else role="list" aria-labelledby="authors-heading">
            <button
              v-for="author in filteredAuthors"
              :key="author.id"
              class="author-item"
              :class="{ 'author-item--active': selectedAuthor === author.name }"
              @click="selectAuthor(author.name)"
              @keydown="handleKeydown($event, () => selectAuthor(author.name))"
              role="listitem"
              :aria-pressed="selectedAuthor === author.name"
              :aria-label="`Filter by author ${author.name}, ${author.count} posts`"
              type="button"
            >
              <ListCategory :title="author.name" :number="author.count" />
            </button>
          </div>
        </nav>

        <SignUpButtonWidget
          title="Sign Up for updates"
          placeholder="Enter your email"
          buttonLabel="Sign Up"
          backgroundColor="#F9F9F9"
          aria-label="Newsletter signup form"
        />
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";
import type { BlogPost, Event } from "@/types/index.ts";
import type { NewsItem } from "@/types/RawSearchResultItem";
import { fetchAllBlogPosts } from "~/composables/fetchBlogData";
import { fetchWeeklyNewsItems } from "~/composables/fetchWeeklyNews";
import { getAuthorName as getAuthorNameUtil } from "~/composables/useAuthorPosts";

const props = defineProps<{ initialCategory?: string }>();

//meta information
useHead({
  title: "RebootDemocracy.AI - Blog Posts and Articles",
  meta: [
    { name: "title", content: "RebootDemocracy.AI - Blog Posts and Articles" },
    {
      property: "og:title",
      content: "RebootDemocracy.AI - Blog Posts and Articles",
    },
    {
      property: "og:description",
      content: `Browse our collection of articles on AI, democracy, and governance. RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to better governance, better outcomes, increased trust in institutions, and in one another.`,
    },
    {
      property: "og:image",
      content:
        "https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3.png",
    },
    {
      property: "twitter:title",
      content: "RebootDemocracy.AI - Blog Posts and Articles",
    },
    {
      property: "twitter:description",
      content: `Browse our collection of articles on AI, democracy, and governance. RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy.`,
    },
    {
      property: "twitter:image",
      content:
        "https://burnes-center.directus.app/assets/5c6c2a6c-d68d-43e3-b14a-89da9e881cc3.png",
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
const authorFilteredPosts = ref<any[]>([]);
const isFilteringByAuthor = ref(false);

// Accessibility: Keyboard navigation handler
const handleKeydown = (event: KeyboardEvent, callback: () => void): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
};

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
  return getAuthorNameUtil(post);
};

const normalizeTagLabel = (name: string): string => {
  if (!name) return name;
  const normalized = name.trim().toLowerCase();
  if (normalized === "news that caught our eye") {
    return "News that Caught Our Eye";
  }
  return name;
};

const getOriginalTag = (post: BlogPost | NewsItem): string => {
  if ("Tags" in post && Array.isArray(post.Tags) && post.Tags.length > 0) {
    return post.Tags[0];
  } else if ("category" in post && post.category) {
    return post.category;
  }
  return "";
};

const extractTagsWithCounts = (posts: (BlogPost | NewsItem)[]): Category[] => {
  if (!posts || posts.length === 0) return [];

  const tagCounts = new Map<string, number>();

  posts.forEach((post) => {
    if ("Tags" in post && Array.isArray(post.Tags)) {
      post.Tags.forEach((tag) => {
        const canonical = normalizeTagLabel(tag);
        tagCounts.set(canonical, (tagCounts.get(canonical) || 0) + 1);
      });
    } else if ("category" in post && post.category) {
      const canonical = normalizeTagLabel(post.category);
      tagCounts.set(canonical, (tagCounts.get(canonical) || 0) + 1);
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

        if (
          authorName &&
          authorName !== "Unknown Author" &&
          authorName !== "Reboot Democracy Team" &&
          authorName.trim() !== ""
        ) {
          if (authorName.includes(",") || authorName.includes(" and ")) {
            const authors = authorName
              .split(/,|\s+and\s+/i)
              .map((a) => (a ? a.trim() : ""))
              .filter((a) => a && a !== "and" && a !== "");

            authors.forEach((author) => {
              if (author && author !== "Reboot Democracy Team") {
                authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
              }
            });
          } else {
            authorCounts.set(
              authorName,
              (authorCounts.get(authorName) || 0) + 1
            );
          }
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

// ... (keeping all your existing data fetching logic exactly the same) ...
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

const { data: eventData, pending: isEventLoading } = await useAsyncData(
  "all-blog-event",
  async () => {
    try {
      let event = await fetchUpcomingEvent();
      let isFutureEvent = true;

      if (!event) {
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
  authors.value.filter((author) => author.count >= 1)
);

watch(selectedAuthor, (newAuthor) => {
  if (newAuthor && !selectedCategory.value) {
    // Client-side filter from preloaded posts; no extra Directus calls
    isFilteringByAuthor.value = true;
    const posts = (allPosts.value || []).filter((post: any) => {
      const name = getAuthorName(post);
      if (!name) return false;
      if (name.includes(",") || name.includes(" and ")) {
        const split = name
          .split(/[,]|(\sand\s)/i)
          .map((a) => (typeof a === "string" ? a.trim() : ""))
          .filter((a) => a && a.toLowerCase() !== "and");
        return split.some((n) => n === newAuthor);
      }
      return name === newAuthor;
    });
    authorFilteredPosts.value = posts;
    isFilteringByAuthor.value = false;
  } else {
    authorFilteredPosts.value = [];
  }
});

// Filtered posts based on selected category/author
const filteredPosts = computed(() => {
  if (selectedAuthor.value && !selectedCategory.value) {
    return authorFilteredPosts.value;
  }

  let filtered = allPosts.value;

  if (selectedCategory.value) {
    filtered = filtered.filter((post) => {
      if ("Tags" in post && Array.isArray(post.Tags)) {
        return post.Tags.some(
          (t: string) => normalizeTagLabel(t) === selectedCategory.value
        );
      } else if ("category" in post && post.category) {
        return normalizeTagLabel(post.category) === selectedCategory.value;
      }
      return false;
    });

    // For merged tags, sort capitalized variant first, then by date within each group
    if (selectedCategory.value === "News that Caught Our Eye") {
      filtered = filtered.sort((a, b) => {
        const tagA = getOriginalTag(a);
        const tagB = getOriginalTag(b);

        // Prioritize "News that Caught Our Eye" (capitalized) over "news that caught our eye" (lowercase)
        const isCapitalizedA = tagA === "News that Caught Our Eye";
        const isCapitalizedB = tagB === "News that Caught Our Eye";

        if (isCapitalizedA && !isCapitalizedB) return -1; // A comes first
        if (!isCapitalizedA && isCapitalizedB) return 1; // B comes first

        // If both same variant, sort by date (newest first)
        const dateA = new Date((a as any).date || 0).getTime();
        const dateB = new Date((b as any).date || 0).getTime();
        return dateB - dateA;
      });
    }
  }

  if (selectedAuthor.value) {
    filtered = filtered.filter((post) => {
      const authorName = getAuthorName(post);

      if (authorName.includes(",") || authorName.includes(" and ")) {
        const authors = authorName
          .split(/[,]|(\sand\s)/i)
          .map((a) => a.trim())
          .filter((a) => a && a !== "and");

        return authors.some((author) => author === selectedAuthor.value);
      } else {
        return authorName === selectedAuthor.value;
      }
    });
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
const getPostKey = (post: any): string => {
  if (post?.type === "news") {
    return `news-${
      post.id ?? post.edition ?? Math.random().toString(36).slice(2)
    }`;
  }
  return `blog-${post.id ?? post.slug ?? Math.random().toString(36).slice(2)}`;
};

const getPostTag = (post: BlogPost | NewsItem): string => {
  // If a specific category is selected and the post contains that category, show it
  if (selectedCategory.value && "Tags" in post && Array.isArray(post.Tags)) {
    const hasSelectedCategory = post.Tags.some(
      (tag) => normalizeTagLabel(tag) === selectedCategory.value
    );
    if (hasSelectedCategory) {
      return selectedCategory.value;
    }
  }

  // If a specific category is selected and the post's category matches, show it
  if (selectedCategory.value && "category" in post && post.category) {
    if (normalizeTagLabel(post.category) === selectedCategory.value) {
      return selectedCategory.value;
    }
  }

  // Otherwise fall back to the original logic
  if ("Tags" in post && Array.isArray(post.Tags) && post.Tags.length > 0) {
    return normalizeTagLabel(post.Tags[0]);
  } else if ("category" in post && post.category) {
    return normalizeTagLabel(post.category);
  }
  return "";
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
const handlePostClick = (post: any): void => {
  if (post?.type === "news" && (post?.edition || post?.id)) {
    const edition = post.edition ?? post.id;
    resetSearch();
    router.push(`/newsthatcaughtoureye/${edition}`);
    return;
  }
  if (post?.slug) {
    resetSearch();
    router.push(`/blog/${post.slug}`);
    return;
  }
  if (post?.url) {
    window.location.href = post.url;
    return;
  }
  console.error("Cannot navigate: Post has no route info", post);
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
  authorFilteredPosts.value = [];
  selectedCategory.value = category;
  currentPage.value = 1;
  if (!isMobile.value) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    // Wait for posts to finish rendering before scrolling to grid
    const stop = watch(
      () => ({
        loading: isPostsLoading.value,
        length: displayedPosts.value.length,
      }),
      (state) => {
        if (!state.loading && state.length > 0) {
          nextTick(() => {
            const grid = document.getElementById("blogcard-grid-wrapper");
            grid?.scrollIntoView({ behavior: "smooth", block: "start" });
            stop();
          });
        }
      },
      { immediate: true }
    );
  }
};

const selectAuthor = (author: string) => {
  selectedCategory.value = null;
  selectedAuthor.value = author;
  currentPage.value = 1;
  if (!isMobile.value) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    // Wait for posts to finish rendering before scrolling to grid
    const stop = watch(
      () => ({
        loading: isPostsLoading.value || isFilteringByAuthor.value,
        length: displayedPosts.value.length,
      }),
      (state) => {
        if (!state.loading && state.length > 0) {
          nextTick(() => {
            const grid = document.getElementById("blogcard-grid-wrapper");
            grid?.scrollIntoView({ behavior: "smooth", block: "start" });
            stop();
          });
        }
      },
      { immediate: true }
    );
  }
};

const clearFilters = () => {
  selectedCategory.value = null;
  selectedAuthor.value = null;
  authorFilteredPosts.value = [];
  currentPage.value = 1;
};

// Helper function for responsive design
const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 1050;
};

// Lifecycle hooks
onMounted(() => {
  window.scrollTo({ top: 0, behavior: "instant" });

  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);

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
    const decodedAuthor = decodeURIComponent(authorParam);
    const foundAuthor = authors.value.find(
      (author) => author.name.toLowerCase() === decodedAuthor.toLowerCase()
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

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.toggle-button:focus,
.category-item:focus,
.author-item:focus,
.blog-post-item:focus {
  outline: none;
  box-shadow: 0 0 0 1px #4a6b8a;
  border-radius: 4px;
}

/* Ensure buttons look like buttons */
.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.category-item,
.author-item {
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.category-item:hover,
.author-item:hover,
.category-item--active,
.author-item--active {
  background-color: rgba(13, 99, 235, 0.1);
}

.blog-post-item {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
}

.blog-post-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (prefers-contrast: high) {
  .toggle-button:focus,
  .category-item:focus,
  .author-item:focus,
  .blog-post-item:focus {
    box-shadow: 0 0 0 3px #000000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .category-item,
  .author-item,
  .blog-post-item {
    transition: none;
  }
}
</style>
