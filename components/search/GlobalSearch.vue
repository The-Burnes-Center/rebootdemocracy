<template>
  <div class="search-results-container" v-if="showSearchResults">
    <!-- Loading state -->
    <div v-if="isSearching" class="loading">
      <div class="loading-spinner"></div>
      <div>Loading results...</div>
    </div>
    
    <!-- No results message -->
    <div v-else-if="typedSearchResults.length === 0" class="no-results">
      No results found for "{{ currentSearchQuery }}". Try a different search term.
    </div>
    
    <!-- Results list -->
    <div v-else class="blog-list-search">
      <div v-if="hasRebootResults" class="result-category">
        <h3 class="result-category-title">Blogs</h3>
        <PostCard
          v-for="item in rebootResults"
          :key="item.objectID"
          :tag="getItemTag(item)"
          :titleText="item.title || 'Untitled'"
          :excerpt="truncateText(item.excerpt ?? '', 150)"
          :author="getItemAuthor(item)"
          :imageUrl="getImageUrl(item.image)"
          :hoverable="true"
        />
      </div>
      
       <div v-if="hasNewsResults" class="result-category">
        <h3 class="result-category-title">News that caught our Eye</h3>
        <PostCard
          v-for="item in newsResults"
          :key="item.objectID"
          :tag="getItemTag(item)"
          :titleText="getNewsTitle(item)"
          :excerpt="getNewsExcerpt(item)"
          :author="getItemAuthor(item)"
          :imageUrl="'/images/exampleImage.png'"
          :date="getNewsDate(item)"
          :hoverable="true"
        />
      </div>
    </div>
    
    <!-- Simple pagination placeholder -->
    <div class="search-pagination" v-if="showLoadMore">
      <Button 
        variant="primary" 
        width="150px" 
        height="36px" 
        @click="loadMoreResults"
        :disabled="isSearching"
      >
        {{ isSearching ? 'Loading...' : 'Show More' }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import useSearchState from "../../composables/useSearchState.js";

// Define type of a single search result item
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
  image?: string;
  _sourceIndex?: string; 
  date?: string | null; 
  edition?: string;
  item?: {
    excerpt?: string;
    title?: string;
    date?: string;
    id?: number;
    url?: string;
  };
  summary?: string;
};

// Get reactive state from the composable
const { 
  searchQuery, 
  showSearchResults, 
  searchResults, 
  isSearching, 
  loadMoreResults, 
  totalResults
} = useSearchState();

// Computed & typed results
const currentSearchQuery = computed(() => searchQuery.value);
const typedSearchResults = computed(
  () => searchResults.value as unknown as SearchResultItem[]
);

// Separate results by source index
const rebootResults = computed(() => 
  typedSearchResults.value.filter(item => item._sourceIndex === "reboot_democracy_blog")
);

const newsResults = computed(() => 
  typedSearchResults.value.filter(item => item._sourceIndex === "reboot-news-that-caught-our-eye-test")
);

const hasRebootResults = computed(() => rebootResults.value.length > 0);
const hasNewsResults = computed(() => newsResults.value.length > 0);

// Compute whether to show "load more" button
const showLoadMore = computed(() =>
  !isSearching.value &&
  typedSearchResults.value.length > 0 &&
  typedSearchResults.value.length < totalResults.value
);

// Image URL helper
const directusUrl = "https://content.thegovlab.com"; 
function getImageUrl(imageId: string | null | undefined, width: number = 512): string {
  if (!imageId) {
    return "/images/exampleImage.png";
  }
  return `${directusUrl}/assets/${imageId}?width=${width}`;
}

// Truncate helper
const truncateText = (text: string, maxLength: number): string => {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
};

// Extract tag
const getItemTag = (item: SearchResultItem): string => {
  if (item._sourceIndex === "reboot-news-that-caught-our-eye-test") {
    return "News that caught our eye"; 
  }
  return item.category || (item.Tags?.[0] ?? "Article");
};

// Extract author name
const getItemAuthor = (item: SearchResultItem): string => {
  if (typeof item.author === "string") return item.author;
  const authorObj = item.authors?.[0]?.team_id;
  if (authorObj?.First_Name && authorObj?.Last_Name) {
    return `${authorObj.First_Name} ${authorObj.Last_Name}`;
  }
  return item.authors?.[0]?.name ?? "Unknown Author";
};

const getNewsTitle = (item: SearchResultItem): string => {
  if (item._sourceIndex === "reboot-news-that-caught-our-eye-test") {
    // Try to use the inner item title if available
    if (item.item?.title) {
      return item.item.title;
    }
    // Fall back to the main title
    return item.title || 'Untitled';
  }
  return item.title || 'Untitled';
};

const getNewsExcerpt = (item: SearchResultItem): string => {
  if (item._sourceIndex === "reboot-news-that-caught-our-eye-test") {
    // Try to use the inner item excerpt if available
    if (item.item?.excerpt) {
      return truncateText(item.item.excerpt, 150);
    }
    // Fall back to the main excerpt
    return truncateText(item.excerpt || item.summary || '', 150);
  }
  return truncateText(item.excerpt || '', 150);
};

const getNewsDate = (item: SearchResultItem): Date | undefined => {
  if (item._sourceIndex === "reboot-news-that-caught-our-eye-test") {
    // Try to use the inner item date first
    if (item.item?.date) {
      return new Date(item.item.date);
    }
    // Fall back to main date
    return item.date ? new Date(item.date) : undefined;
  }
  return undefined;
};
</script>

