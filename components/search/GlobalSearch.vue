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
          @click="navigateToBlogPost(item)"
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
          :author="getNewsItemAuthor(item)"
          :imageUrl="'/images/exampleImage.png'"
          :date="getNewsDate(item)"
          :hoverable="true"
          @click="() => openInNewTab(item.item?.url)"
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

const navigateToBlogPost = (item: SearchResultItem) => {
  if (item.slug) {
    router.push(`/blog/${item.slug}`);
  } else {
    console.error("Cannot navigate: item has no slug", item);
  }
};

const openInNewTab = (url: string | undefined) => {
  window.open(url, '_blank');
};

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

function getImageUrl(
  imageId: string | null | undefined,
  width: number = 512
): string {
  return imageId
    ? `${directusUrl}/assets/${imageId}?width=${width}`
    : "/images/exampleImage.png";
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
}

function getItemTag(item: SearchResultItem): string {
  if (item._sourceIndex === "reboot_democracy_weekly_news") {
    return "News that caught our eye";
  }
  return item.category || item.Tags?.[0] || "Article";
}

function getItemAuthor(item: SearchResultItem): string {
  if (typeof item.author === "string") return item.author;
  const authorObj = item.authors?.[0]?.team_id;
  if (authorObj?.First_Name && authorObj?.Last_Name) {
    return `${authorObj.First_Name} ${authorObj.Last_Name}`;
  }
  return item.authors?.[0]?.name ?? "Unknown Author";
}

function getNewsItemAuthor(item: SearchResultItem): string | undefined {
  if (typeof item?.item?.author === "string") {
    return item.item.author;
  }
  return undefined;
}

function getNewsTitle(item: SearchResultItem): string {
  return item.item?.title || item.title || "Untitled";
}

function getNewsExcerpt(item: SearchResultItem): string {
  return truncateText(
    item.item?.excerpt || item.excerpt || item.summary || "",
    150
  );
}

function getNewsDate(item: SearchResultItem): Date | undefined {
  const dateString = item.item?.date || item.date;
  return dateString ? new Date(dateString) : undefined;
}
</script>
