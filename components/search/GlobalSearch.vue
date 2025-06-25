<template>
  <div class="search-results-container" v-if="showSearchResults">
    <!-- Loading state -->
    <div v-if="isSearching" class="loading">
      <div class="loading-spinner"></div>
      <div>Loading results...</div>
    </div>

    <!-- No results message -->
    <div v-else-if="typedSearchResults.length === 0" class="no-results">
      No results found for "{{ currentSearchQuery }}". Try a different search
      term.
    </div>

    <!-- Combined Results list -->
    <div v-else class="blog-list-search">
      <div class="result-category">
        <PostCard
          v-for="item in mergedResults"
          :key="item.objectID"
          :tag="getItemTag(item)"
          :titleText="getItemTitle(item)"
          :excerpt="getItemExcerpt(item)"
          :author="getItemAuthor(item)"
          :imageUrl="getItemImageUrl(item)"
          :date="getItemDate(item)"
          :hoverable="true"
          @click="handleItemClick(item)"
        />
      </div>
    </div>

    <!-- Simple pagination placeholder -->
    <div class="search-pagination" v-if="showLoadMore">
      <Button
        variant="secondary"
        width="150px"
        height="36px"
        @click="loadMoreResults"
        :disabled="isSearching"
      >
        {{ isSearching ? "Loading..." : "Show More" }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import useSearchState from "../../composables/useSearchState.js";

const router = useRouter();

type SearchResultItem = {
  objectID: string;
  title?: string;
  excerpt?: string;
  slug?: string;
  type?: string;
  category?: string;
  Tags?: string[];
  author?: string;
  authors?: any[];
  image?:
    | string
    | {
        id?: string;
        filename_disk?: string;
      };
  _sourceIndex?: string;
  date?: string | null;
  edition?: string;
  summary?: string;
  // REMOVED: item property since we're treating weekly news as single entries
};

const {
  searchQuery,
  showSearchResults,
  searchResults,
  isSearching,
  loadMoreResults,
  totalResults,
} = useSearchState();

const currentSearchQuery = computed(() => searchQuery.value);
const typedSearchResults = computed(
  () => searchResults.value as unknown as SearchResultItem[]
);

// Create merged results from both reboot and news results
const mergedResults = computed(() => {
  const today = new Date();
  return typedSearchResults.value.filter((item) => {
    // UPDATED: Handle date filtering for both blog posts and weekly news entries
    const dateStr = item.date;
    if (!dateStr) return false;

    const itemDate = new Date(dateStr);
    return itemDate < today;
  });
});

const newsResults = computed(() =>
  typedSearchResults.value.filter(
    (item) => item._sourceIndex === "reboot_democracy_weekly_news"
  )
);

const rebootResults = computed(() =>
  typedSearchResults.value.filter(
    (item) => item._sourceIndex === "reboot_democracy_blog"
  )
);

const hasRebootResults = computed(() => rebootResults.value.length > 0);
const hasNewsResults = computed(() => newsResults.value.length > 0);

const showLoadMore = computed(
  () =>
    !isSearching.value &&
    typedSearchResults.value.length > 0 &&
    typedSearchResults.value.length < totalResults.value
);

const directusUrl = "https://burnes-center.directus.app/";
// UPDATED: Unified handlers for all item types
function getItemTitle(item: SearchResultItem): string {
  return item.title || "Untitled";
}

function getItemExcerpt(item: SearchResultItem): string {
  // UPDATED: Handle both blog posts and weekly news entries
  const text = item._sourceIndex === "reboot_democracy_weekly_news"
    ? item.summary || item.excerpt || ""
    : item.excerpt || "";

  return truncateText(text, 150);
}

function getItemAuthor(item: SearchResultItem): string {
  // UPDATED: Handle both blog posts and weekly news entries
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    // For weekly news, author is directly on the entry
    return item.author || "Unknown Author";
  }

  // For blog posts, handle the authors array structure
  if (typeof item.author === "string") return item.author;
  const authorObj = item.authors?.[0]?.team_id;
  if (authorObj?.First_Name && authorObj?.Last_Name) {
    return `${authorObj.First_Name} ${authorObj.Last_Name}`;
  }
  return item.authors?.[0]?.name ?? "Unknown Author";
}

function getItemImageUrl(item: SearchResultItem): string {
  // UPDATED: Handle images for both content types
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    // Weekly news might have images, but default to placeholder if not
    if (typeof item.image === "object" && item.image?.id) {
      return `${directusUrl}assets/${item.image.id}?width=512`;
    }
    return "/images/exampleImage.png";
  }

  // Blog posts
  if (typeof item.image === "object" && item.image?.filename_disk) {
    return getImageUrl(item.image, 512);
  }

  return "/images/exampleImage.png";
}

function getItemDate(item: SearchResultItem): Date | undefined {
  return item.date ? new Date(item.date) : undefined;
}

function getItemTag(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    return "News that caught our eye";
  }
  
  // For blog posts, use Tags or default
  if (item.Tags && Array.isArray(item.Tags) && item.Tags.length > 0) {
    return item.Tags[0];
  }
  
  return "Blog";
}

// UPDATED: Handle navigation for both content types
function handleItemClick(item: SearchResultItem): void {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    // Navigate to weekly news page using edition
    if (item.edition) {
      const edition = String(item.edition).replace(/\D/g, "");
      router.push(`/newsthatcaughtoureye/${edition}`);
    } else {
      console.error("Cannot navigate: weekly news item has no edition", item);
    }
  } else {
    // Navigate to blog post
    navigateToBlogPost(item);
  }
}

function navigateToBlogPost(item: SearchResultItem) {
  if (item.slug) {
    router.push(`/blog/${item.slug}`);
  } else {
    console.error("Cannot navigate: item has no slug", item);
  }
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
}

// Helper function for image URLs
function getImageUrl(image: { id?: string; filename_disk?: string }, width?: number): string {
  if (image.id) {
    return `${directusUrl}assets/${image.id}${width ? `?width=${width}` : ''}`;
  }
  return "/images/exampleImage.png";
}
</script>