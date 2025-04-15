<template>
  <div class="all-posts-page">
    <Hero
      title="Rebooting Democracy in the Age of AI"
      subtitle="Insights on AI, Governance and Democracy"
    />
    <section class="all-posts-page-layout">
      <article
        class="left-content"
        :class="{ 'search-active': showSearchResults }"
      >
        <!-- Show GlobalSearch when searching -->
        <GlobalSearch v-if="showSearchResults" />

        <!-- Otherwise show regular posts content -->
        <template v-else>
          <div v-if="isLoading" class="loading">Loading blogs...</div>

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

          <!-- No blogs found message -->
          <div v-else-if="!isLoading" class="no-blogs">
            <span v-if="selectedCategory">
              No posts found in category "{{ selectedCategory }}"
            </span>
            <span v-else-if="selectedAuthor">
              No posts found by author "{{ selectedAuthor }}"
            </span>
            <span v-else>No blog posts found.</span>
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
            :class="{ 'category-item--active': selectedCategory === tag.name }"
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
import type { BlogPost, Event } from "@/types/index.ts";

// Constants
const DIRECTUS_URL = "https://content.thegovlab.com";
const POSTS_PER_PAGE = 7;
const router = useRouter();
const route = useRoute();

// State management
const { showSearchResults, resetSearch } = useSearchState();
const isFutureEvent = ref(true);


// Data state
const allPosts = ref<BlogPost[]>([]);
const filteredPosts = ref<BlogPost[]>([]);
const displayedPosts = ref<BlogPost[]>([]);
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

// Helper methods
function getImageUrl(image: any, width: number = 512): string {
  return image?.filename_disk
    ? `${DIRECTUS_URL}/assets/${image.filename_disk}?width=${width}`
    : "/images/exampleImage.png";
}

const getAuthorName = (post: BlogPost): string => {
  const author = post.authors?.[0]?.team_id;
  return author ? `${author.First_Name} ${author.Last_Name}` : "Unknown Author";
};

// Navigation
const navigateToBlogPost = (post: BlogPost) => {
  if (post.slug) {
    resetSearch();
    router.push(`/blog/${post.slug}`);
  } else {
    console.error("Cannot navigate: Blog post has no slug", post);
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
    filtered = filtered.filter(
      (post) =>
        post.Tags &&
        Array.isArray(post.Tags) &&
        selectedCategory.value && post.Tags.includes(selectedCategory.value)
    );
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

// Data processing
const extractTagsWithCounts = (posts: BlogPost[]): Category[] => {
  if (!posts || posts.length === 0) return [];

  const tagCounts = new Map<string, number>();

  posts.forEach((post) => {
    if (post.Tags && Array.isArray(post.Tags)) {
      post.Tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ id: name, name, count }))
    .sort((a, b) => b.count - a.count);
};

const extractAuthorsWithCounts = (posts: BlogPost[]): Author[] => {
  if (!posts || posts.length === 0) return [];

  const authorCounts = new Map<string, number>();

  posts.forEach((post) => {
    const authorName = getAuthorName(post);
    if (authorName !== "Unknown Author") {
      authorCounts.set(authorName, (authorCounts.get(authorName) || 0) + 1);
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

    const blogPosts = await fetchAllBlogPosts();

    allPosts.value = blogPosts;
    filteredPosts.value = blogPosts;
    displayedPosts.value = blogPosts.slice(0, POSTS_PER_PAGE);

    tags.value = extractTagsWithCounts(blogPosts);
    authors.value = extractAuthorsWithCounts(blogPosts);

    return { posts: blogPosts, tags: tags.value, authors: authors.value };
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

// Lifecycle management
onMounted(() => {
  loadInitialData().then(() => {
    // Check for author query parameter
    const authorParam = route.query.author as string | undefined;
    if (authorParam) {
      // Find the matching author from the loaded authors
      const foundAuthor = authors.value.find(author => 
        author.name.toLowerCase() === authorParam.toLowerCase());
      
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

<style scoped>
.results-and-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  min-height: 36px;
}

.results-count {
  flex: 1;
}

.filter-actions {
  flex-shrink: 0;
}

.section-title {
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}

.category-list,
.author-list {
  margin-bottom: 1.5rem;
}

.category-item,
.author-item {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.category-item:hover,
.author-item:hover {
  background-color: #f5f5f5;
}

.category-item--active,
.author-item--active {
  background-color: #e6f0ff;
  font-weight: bold;
}

.loading-tags {
  padding: 1rem;
  text-align: center;
  color: #666;
}
</style>