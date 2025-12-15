<template>
  <header class="hero__container" role="banner">
    <div class="hero__content">
      <Text
        as="h1"
        :size="'6xl'"
        :weight="'bold'"
        :fontFamily="'merriweather'"
        class="hero__title"
        id="main-heading"
      >
        {{ title }}
      </Text>
      <Text
        as="p"
        :size="'2xl'"
        :weight="'semibold'"
        :fontFamily="'merriweather'"
        class="hero__subtitle"
        role="text"
        aria-describedby="main-heading"
      >
        {{ subtitle }}
      </Text>
    </div>
    
    <div class="search-content" role="search" aria-label="Search blog posts">
      <ais-instant-search
        :index-name="primaryIndex"
        :search-client="algoliaClient"
      >
        <ais-search-box
          @input="handleSearchInput"
          @reset="handleSearchReset"
          class="custom-searchbox"
          aria-label="Search for blog posts and articles"
        />
      </ais-instant-search>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  AisInstantSearch,
  AisSearchBox,
  // @ts-ignore
} from "vue-instantsearch/vue3/es";

const primaryIndex = "reboot_democracy_blog";
const indices = [primaryIndex, "reboot_democracy_weekly_news"];

const { updateSearchQuery, setIndexNames, getAlgoliaClient } = useSearchState();
const algoliaClient = getAlgoliaClient();
setIndexNames(indices);

// Handle search input changes
const handleSearchInput = (event: InputEvent): void => {
  const query = (event.target as HTMLInputElement)?.value;
  updateSearchQuery(query);
};

const handleSearchReset = () => {
  updateSearchQuery("");
};

interface HeroProps {
  title: string;
  subtitle: string;
}

const props = withDefaults(defineProps<HeroProps>(), {
  title: "Rebooting Democracy in the Age of AI",
  subtitle: "Insights on AI, Governance and Democracy",
});
</script>

<style scoped>
@media (max-width: 768px) {
  :deep(.custom-searchbox .ais-SearchBox-input),
  :deep(.custom-searchbox input[type="search"]),
  :deep(.custom-searchbox input) {
    font-size: 16px !important;
  }
}
</style>