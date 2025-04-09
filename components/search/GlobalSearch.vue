<template>
  <div class="search-results-container" v-if="showSearchResults">

    <!-- Loading state -->
          <div v-if="isSearching" class="loading">
            <div class="loading-spinner"></div>
            <div>Loading blogs...</div>
          </div>

    <!-- No results message -->
    <div v-else-if="typedSearchResults.length === 0" class="no-results">
      No results found for "{{ currentSearchQuery }}". Try a different search
      term.
    </div>

    <!-- Results list -->
    <div v-else class="blog-list-search">
      <PostCard
      v-for="item in typedSearchResults"
      :key="item.objectID"
      :tag="getItemTag(item)"
      :titleText="item.title || 'Untitled'"
      :excerpt="truncateText(item.excerpt ?? '', 150)"
      :author="getItemAuthor(item)"
      :imageUrl="item.imageUrl || '/images/exampleImage.png'"          
      :hoverable="true"
    />
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
import { useRouter } from "vue-router";
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
  imageUrl?: string;
};

const indexName = "reboot test data";
const { loadMoreResults, setIndexName, getAlgoliaClient, totalResults } = useSearchState();
const algoliaClient = getAlgoliaClient();
setIndexName(indexName);

const showLoadMore = computed(() =>
  !isSearching.value &&
  typedSearchResults.value.length > 0 &&
  typedSearchResults.value.length < totalResults.value
);

const router = useRouter();

// Get reactive state from the composable
const { searchQuery, showSearchResults, searchResults, isSearching } =
  useSearchState();

// Computed & typed results
const currentSearchQuery = computed(() => searchQuery.value);
const typedSearchResults = computed(
  () => searchResults.value as unknown as SearchResultItem[]
);

// Truncate helper
const truncateText = (text: string, maxLength: number): string => {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
};

// Extract tag
const getItemTag = (item: SearchResultItem): string => {
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
</script>

