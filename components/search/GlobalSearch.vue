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
        variant="primary"
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
  image?: string;
  _sourceIndex?: string;
  date?: string | null;
  edition?: string;
  item?: {
    author?: string;
    excerpt?: string;
    category?: string;
    title?: string;
    date?: string;
    id?: number;
    url: string;
  };
  summary?: string;
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
  return typedSearchResults.value;
});

const rebootResults = computed(() =>
  typedSearchResults.value.filter(
    (item) => item._sourceIndex === "reboot_democracy_blog"
  )
);

const newsResults = computed(() =>
  typedSearchResults.value.filter(
    (item) => item._sourceIndex === "reboot_democracy_weekly_news"
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

const directusUrl = "https://content.thegovlab.com";

// Unified handlers for all item types
function getItemTitle(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    return item.item?.title || item.title || "Untitled";
  }
  return item.title || "Untitled";
}

function getItemExcerpt(item: SearchResultItem): string {
  const text =
    item._sourceIndex === "reboot_democracy_weekly_news"
      ? item.item?.excerpt || item.excerpt || item.summary || ""
      : item.excerpt || "";

  return truncateText(text, 150);
}

function getItemAuthor(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    if (typeof item?.item?.author === "string") {
      return item.item.author;
    }
    return "Unknown Author";
  }

  if (typeof item.author === "string") return item.author;
  const authorObj = item.authors?.[0]?.team_id;
  if (authorObj?.First_Name && authorObj?.Last_Name) {
    return `${authorObj.First_Name} ${authorObj.Last_Name}`;
  }
  return item.authors?.[0]?.name ?? "Unknown Author";
}

function getItemImageUrl(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    return "/images/exampleImage.png";
  }

  return item.image
    ? `${directusUrl}/assets/${item.image}?width=512`
    : "/images/exampleImage.png";
}

function getItemDate(item: SearchResultItem): Date | undefined {
  const dateString =
    item._sourceIndex === "reboot_democracy_weekly_news"
      ? item.item?.date || item.date
      : item.date;

  return dateString ? new Date(dateString) : undefined;
}

function getItemTag(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    return item?.item?.category || "News that caught our eye";
  }
  return "Blog";
}

function handleItemClick(item: SearchResultItem): void {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    openInNewTab(item.item?.url);
  } else {
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

function openInNewTab(url: string | undefined) {
  if (url) {
    window.open(url, "_blank");
  }
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
}
</script>
