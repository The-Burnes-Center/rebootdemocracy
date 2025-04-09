<template>
  <div class="hero__container">
    <div class="hero__content">
      <Text 
        as="h1" 
        :size="'2xl'" 
        :weight="'light'" 
        :fontFamily="'inria'" 
        class="hero__title"
      >
        {{ title }}
      </Text>
      <Text 
        as="p" 
        :size="'xs'" 
        :weight="'bold'" 
        :fontFamily="'inria'" 
        class="hero__subtitle"
      >
        {{ subtitle }}
      </Text>
    </div>
    
    <div class="search-content">
    <ais-instant-search ais-instant-search :index-name="indexName" :search-client="algoliaClient">
        <ais-search-box @input="handleSearchInput" @reset="handleSearchReset" class="custom-searchbox" />
      </ais-instant-search>
    </div>
  </div>
</template>

<script setup lang="ts">

import {
  AisInstantSearch,
  AisSearchBox,
  // @ts-ignore
} from "vue-instantsearch/vue3/es";
import useSearchState from "../../composables/useSearchState.js";

const indexName = "reboot test data";

const { updateSearchQuery, setIndexName, getAlgoliaClient } = useSearchState();
const algoliaClient = getAlgoliaClient();
setIndexName(indexName); 

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
  firstPartnerLogo: string;
  firstPartnerAlt: string;
  secondPartnerLogo: string;
  secondPartnerAlt: string;
}

const props = withDefaults(defineProps<HeroProps>(), {
  title: "Rebooting Democracy in the Age of AI",
  subtitle: "Insights on AI, Governance and Democracy",
});
</script>