<template>
  <div class="search-results-container" v-if="showSearchResults">
    <!-- Loading state -->
    <div v-if="isSearching" class="loading">
      <div class="loading-spinner"></div>
      <div>Loading results...</div>
    </div>

    <!-- No results message -->
    <div v-else-if="processedResults.length === 0" class="no-results">
      No results found for "{{ currentSearchQuery }}". Try a different search
      term.
    </div>

    <!-- Combined Results list -->
    <div v-else class="blog-list-search">
      <div class="result-category">
        <PostCard
          v-for="item in processedResults"
          :key="getUniqueKey(item)"
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
        width="160px"
        height="40px"
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
import { useRouter, useRoute } from "vue-router";
import { refreshNuxtData } from "#app";
import useSearchState from "../../composables/useSearchState.js";

const router = useRouter();
const route = useRoute();

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
  relevanceScore?: number; 
};

const {
  searchQuery,
  showSearchResults,
  searchResults,
  isSearching,
  loadMoreResults,
  totalResults,
  toggleSearchVisibility,
} = useSearchState();

const currentSearchQuery = computed(() => searchQuery.value);
const typedSearchResults = computed(
  () => searchResults.value as unknown as SearchResultItem[]
);

/**
 * Calculate relevance score for search results
 * Higher scores appear first
 */
function calculateRelevanceScore(item: SearchResultItem, query: string): number {
  let score = 0;
  const lowerQuery = query.toLowerCase().trim();
  const title = (item.title || "").toLowerCase();
  
  // Exact title match gets highest priority
  if (title === lowerQuery) {
    score += 1000;
  }
  
  // Title contains exact query phrase
  if (title.includes(lowerQuery)) {
    score += 500;
  }
  
  // Check for edition number match (e.g., "#70")
  const editionMatch = lowerQuery.match(/#?(\d+)/);
  if (editionMatch) {
    const queryEdition = editionMatch[1];
    const itemEdition = String(item.edition || "").replace(/\D/g, "");
    if (itemEdition === queryEdition) {
      score += 800; // High score for edition match
    }
  }
  
  // Title starts with query
  if (title.startsWith(lowerQuery)) {
    score += 300;
  }
  
  // Individual word matches in title
  const queryWords = lowerQuery.split(/\s+/);
  queryWords.forEach(word => {
    if (word && title.includes(word)) {
      score += 50;
    }
  });
  
  // Check excerpt/summary for matches (lower priority)
  const excerpt = (item.excerpt || item.summary || "").toLowerCase();
  if (excerpt.includes(lowerQuery)) {
    score += 20;
  }
  
  // Boost score for news items if searching for "news"
  if (lowerQuery.includes("news") && item._sourceIndex === "reboot_democracy_weekly_news") {
    score += 100;
  }
  
  // More recent items get a small boost
  if (item.date) {
    const itemDate = new Date(item.date);
    const daysSincePublished = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 30) {
      score += 30;
    } else if (daysSincePublished < 90) {
      score += 10;
    }
  }
  
  return score;
}

/**
 * Remove duplicate entries based on unique identifiers
 */
function deduplicateResults(results: SearchResultItem[]): SearchResultItem[] {
  const seen = new Map<string, SearchResultItem>();
  
  results.forEach(item => {
    // Create a unique key based on content type and identifier
    let uniqueKey: string;
    
    if (item._sourceIndex === "reboot_democracy_weekly_news") {
      // For news items, use edition as unique identifier
      uniqueKey = `news-${item.edition || item.objectID}`;
    } else {
      // For blog posts, use slug or objectID
      uniqueKey = `blog-${item.slug || item.objectID}`;
    }
    
    // Keep the first occurrence (which should be the highest scored after sorting)
    if (!seen.has(uniqueKey)) {
      seen.set(uniqueKey, item);
    } else {
      // If we've seen this before, keep the one with more complete data
      const existing = seen.get(uniqueKey)!;
      if (!existing.excerpt && item.excerpt) {
        seen.set(uniqueKey, item);
      }
    }
  });
  
  return Array.from(seen.values());
}

/**
 * Process and rank search results
 */
const processedResults = computed(() => {
  const today = new Date();
  
  // First, filter out future-dated items
  let filtered = typedSearchResults.value.filter((item) => {
    const dateStr = item.date;
    if (!dateStr) return true; 
    
    const itemDate = new Date(dateStr);
    return itemDate <= today;
  });
  
  // Calculate relevance scores
  filtered = filtered.map(item => ({
    ...item,
    relevanceScore: calculateRelevanceScore(item, currentSearchQuery.value)
  }));
  
  // Sort by relevance score (highest first)
  filtered.sort((a, b) => {
    const scoreA = a.relevanceScore || 0;
    const scoreB = b.relevanceScore || 0;
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Higher scores first
    }
    
    // If scores are equal, sort by date (most recent first)
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  // Remove duplicates while preserving order
  return deduplicateResults(filtered);
});

// Separate filtered results by type (for potential future use)
const newsResults = computed(() =>
  processedResults.value.filter(
    (item) => item._sourceIndex === "reboot_democracy_weekly_news"
  )
);

const rebootResults = computed(() =>
  processedResults.value.filter(
    (item) => item._sourceIndex === "reboot_democracy_blog"
  )
);

const hasRebootResults = computed(() => rebootResults.value.length > 0);
const hasNewsResults = computed(() => newsResults.value.length > 0);

const showLoadMore = computed(
  () =>
    !isSearching.value &&
    processedResults.value.length > 0 &&
    typedSearchResults.value.length < totalResults.value
);

const directusUrl = "https://burnes-center.directus.app/";

/**
 * Generate unique key for v-for
 */
function getUniqueKey(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    return `news-${item.edition || item.objectID}`;
  }
  return `blog-${item.slug || item.objectID}`;
}

// Unified handlers for all item types
function getItemTitle(item: SearchResultItem): string {
  return item.title || "Untitled";
}

function getItemExcerpt(item: SearchResultItem): string {
  const text = item._sourceIndex === "reboot_democracy_weekly_news"
    ? item.summary || item.excerpt || ""
    : item.excerpt || "";

  return truncateText(text, 150);
}

function getItemAuthor(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
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
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
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

// Handle navigation for both content types
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
    const targetPath = `/blog/${item.slug}`;
    const currentSlug = route.params?.slug as string | undefined;
    if (currentSlug && currentSlug === item.slug) {
      // Close search overlay so content is visible
      toggleSearchVisibility(false);
      // Refresh the existing data for this page
      refreshNuxtData(`blog-${item.slug}`);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      router.push(targetPath);
    }
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

<style scoped>
/* Add any component-specific styles here */
.search-results-container {
  width: 100%;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.blog-list-search {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-category {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-pagination {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}
</style>