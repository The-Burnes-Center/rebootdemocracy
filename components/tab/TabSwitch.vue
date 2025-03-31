<!-- TabSwitch.vue -->
<template>
  <div class="tab-switch">
    <div class="tab-headers">
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
import { ref, onMounted, defineProps, defineEmits } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

interface TabItem {
  title: string;
  name: string;
  url?: string;
  external?: boolean;
}

const props = defineProps<{
  tabs: TabItem[];
  initialTab?: number;
}>();

const emit = defineEmits<{
  (e: "tab-changed", index: number, name: string): void;
}>();

// Fix: Use a regular variable instead of .value reference
const activeTab = ref(props.initialTab !== undefined ? props.initialTab : 0);
const showContent = ref(true);

function handleTabClick(tab: TabItem, index: number) {
  activeTab.value = index;
  emit("tab-changed", index, tab.name);

  if (tab.url) {
    setTimeout(() => {
      if (tab.external) {
        window.open(tab.url, "_blank");
      } else {
        router.push(tab.url);
      }
    }, 100);
  }
}

onMounted(() => {
  if (props.tabs.length > 0) {
    const initialIndex = activeTab.value;
    emit("tab-changed", initialIndex, props.tabs[initialIndex].name);
  }
});
</script>
