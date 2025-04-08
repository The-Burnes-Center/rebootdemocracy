<template>
  <div class="search-results-container" v-if="showSearchResults">
    <div class="search-results-header">
      <h2>Search Results for: "{{ currentSearchQuery }}"</h2>
    </div>

    <!-- Loading state -->
    <div v-if="isSearching" class="loading">Loading search results...</div>

    <!-- No results message -->
    <div v-else-if="typedSearchResults.length === 0" class="no-results">
      No results found for "{{ currentSearchQuery }}". Try a different search
      term.
    </div>

    <!-- Results list -->
    <div v-else class="blog-list">
      <div
        v-for="item in typedSearchResults"
        :key="item.objectID"
        class="search-result-item"
      >
        <h1>{{ item.title || "Untitled" }}</h1>
        <p v-if="item.excerpt">{{ truncateText(item.excerpt, 150) }}</p>

        <div class="item-meta">
          <span class="item-tag">{{ getItemTag(item) }}</span>
          <span class="item-author">{{ getItemAuthor(item) }}</span>
        </div>
      </div>
    </div>

    <!-- Simple pagination placeholder -->
    <div class="search-pagination" v-if="typedSearchResults.length > 0"></div>
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
};

// Router for navigation
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

<style scoped>
.search-results-container {
  width: 100%;
  margin: 2rem 0;
}

.search-results-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.search-results-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.blog-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.search-result-item {
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.search-result-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.search-result-item h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 0.85rem;
}

.item-tag {
  background-color: #e9e9e9;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  color: #666;
}

.item-author {
  color: #666;
}

.no-results {
  padding: 2rem;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.125rem;
  color: #666;
}

.search-pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}
</style>
