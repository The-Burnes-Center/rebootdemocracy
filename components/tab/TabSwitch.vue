<!-- TabSwitch.vue -->
<template>
  <div class="tab-switch">
    <div class="tab-headers">
      <div class="tab-buttons">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          class="tab-button"
          :class="{ active: activeTab === index }"
          @click="handleTabClick(tab, index)"
        >
          <span class="tab-label" :class="{ active: activeTab === index }">
            {{ tab.title }}
          </span>
        </button>
      </div>
    </div>
    
    <div class="filter-container" v-if="showFilter && (activeTab === 0 || activeTab === 1)">
      <FilterDropdown
        :options="tagOptions"
        :defaultSelected="selectedTag || 'All Topics'"
        label="Filter by Topics:"
        @option-selected="handleTagFilter"
      />
        <FilterDropdown
          :options="authorOptions"
          :defaultSelected="selectedAuthor || 'All Authors'"
          label="Filter by Author:"
          @option-selected="handleAuthorFilter"
        />
    </div>

    <div v-if="showContent" class="tab-content">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-pane"
        v-show="activeTab === index"
      >
        <slot :name="tab.name" />
      </div>
    </div>
  </div>
  
</template>

<script lang="ts" setup>
import { ref, onMounted, defineProps, defineEmits, nextTick } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

interface TabItem {
  title: string;
  name: string;
  url?: string;
  external?: boolean;
}

const props = defineProps({
  tabs: {
    type: Array as () => TabItem[],
    required: true
  },
  initialTab: {
    type: Number,
    default: 0
  },
  showFilter: {
    type: Boolean,
    default: true
  },
  tagOptions: {
     type: Array as () => string[],
  default: () => []
  },
  authorOptions: {
    type: Array as () => string[],
    default: () => []
  },
  selectedTag: {
    type: String,
    default: ''
  },
  selectedAuthor: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'tab-changed', 
  'tag-filter',
  'author-filter'
]);

const activeTab = ref(props.initialTab !== undefined ? props.initialTab : 0);
const showContent = ref(true);

function handleTabClick(tab: TabItem, index: number) {
  activeTab.value = index;
  emit("tab-changed", index, tab.name);

  if (tab.url && !(index === 1 && props.showFilter)) {
    if (tab.external) {
      window.location.href = tab.url;
    } else {
      router.push(tab.url);
    }
  }
}

function handleTagFilter(option: string | { name: string }) {
  const tagValue = typeof option === 'string' ? option : option.name;
  emit("tag-filter", tagValue);
}

function handleAuthorFilter(option: string | { name: string }) {
  const authorValue = typeof option === 'string' ? option : option.name;
  emit("author-filter", authorValue);
}

onMounted(() => {
  if (props.tabs.length > 0) {
    const initialIndex = activeTab.value;
    emit("tab-changed", initialIndex, props.tabs[initialIndex].name);
  }
});
</script>

