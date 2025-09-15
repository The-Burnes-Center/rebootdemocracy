<template>
  <div class="filter-dropdown" @click.stop>
    <label v-if="label" :for="dropdownId" class="filter-dropdown__label">
      {{ label }}
    </label>

    <div
      class="filter-dropdown__select"
      @click="toggleDropdown"
      :class="{ 'filter-dropdown__select--open': isOpen }"
    >
      <button
        :id="dropdownId"
        class="filter-dropdown__button"
        @keydown="handleKeydown"
        :aria-expanded="isOpen"
        :aria-haspopup="'listbox'"
        :aria-label="label ? undefined : 'Filter options'"
        type="button"
        style="
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          padding: 0;
          font: inherit;
          cursor: pointer;
        "
      >
        <span class="filter-dropdown__value">{{ selected }}</span>
      </button>

      <svg
        class="filter-dropdown__arrow"
        :class="{ 'filter-dropdown__arrow--open': isOpen }"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M7 10L12 15L17 10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <div
        v-if="isOpen"
        class="filter-dropdown__options"
        @click.stop
        role="listbox"
        :aria-labelledby="dropdownId"
      >
        <div
          v-for="(option, index) in options"
          :key="typeof option === 'string' ? option : option.id || option.name"
          class="filter-dropdown__option"
          @click.stop="selectOption(option)"
          role="option"
          :aria-selected="isSelected(option)"
          :tabindex="focusedIndex === index ? 0 : -1"
          @keydown="handleOptionKeydown($event, option, index)"
          :ref="(el) => setOptionRef(el as HTMLElement | null, index)"
        >
          {{ typeof option === "string" ? option : option.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";

interface TagItem {
  id?: string;
  name: string;
}

type OptionType = string | TagItem;

const props = defineProps({
  options: {
    type: Array as () => OptionType[],
    required: true,
  },
  defaultSelected: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["option-selected"]);

const isOpen = ref(false);
const selected = ref("");
const focusedIndex = ref(-1);
const optionRefs = ref<(HTMLElement | null)[]>([]);
const dropdownId = computed(
  () => `dropdown-${Math.random().toString(36).substr(2, 9)}`
);

const setOptionRef = (el: HTMLElement | null, index: number) => {
  if (el) {
    optionRefs.value[index] = el;
  }
};

const isSelected = (option: OptionType): boolean => {
  const optionValue = typeof option === "string" ? option : option.name;
  return optionValue === selected.value;
};

onMounted(() => {
  if (props.defaultSelected) {
    selected.value = props.defaultSelected;
  } else if (props.options.length > 0) {
    const firstOption = props.options[0];
    selected.value =
      typeof firstOption === "string" ? firstOption : firstOption.name;
  }

  document.addEventListener("click", closeDropdown);
});

// Watch for changes in defaultSelected prop and update the selected value
watch(() => props.defaultSelected, (newDefaultSelected) => {
  if (newDefaultSelected) {
    selected.value = newDefaultSelected;
  }
});

onUnmounted(() => {
  document.removeEventListener("click", closeDropdown);
});

const toggleDropdown = async (event: MouseEvent) => {
  event.stopPropagation();
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    focusedIndex.value = 0;
    await nextTick();
    optionRefs.value[0]?.focus();
  }
};

const closeDropdown = () => {
  isOpen.value = false;
  focusedIndex.value = -1;
};

const selectOption = (option: OptionType) => {
  selected.value = typeof option === "string" ? option : option.name;
  emit("option-selected", option);
  isOpen.value = false;
  focusedIndex.value = -1;
};

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case "Enter":
    case " ":
      event.preventDefault();
      toggleDropdown(event as any);
      break;
    case "ArrowDown":
      event.preventDefault();
      if (!isOpen.value) {
        toggleDropdown(event as any);
      }
      break;
    case "Escape":
      if (isOpen.value) {
        event.preventDefault();
        closeDropdown();
      }
      break;
  }
};

const handleOptionKeydown = async (
  event: KeyboardEvent,
  option: OptionType,
  index: number
) => {
  switch (event.key) {
    case "Enter":
    case " ":
      event.preventDefault();
      selectOption(option);
      break;
    case "ArrowDown":
      event.preventDefault();
      focusedIndex.value = Math.min(index + 1, props.options.length - 1);
      await nextTick();
      optionRefs.value[focusedIndex.value]?.focus();
      break;
    case "ArrowUp":
      event.preventDefault();
      focusedIndex.value = Math.max(index - 1, 0);
      await nextTick();
      optionRefs.value[focusedIndex.value]?.focus();
      break;
    case "Escape":
      event.preventDefault();
      closeDropdown();
      document.getElementById(dropdownId.value)?.focus();
      break;
    case "Home":
      event.preventDefault();
      focusedIndex.value = 0;
      await nextTick();
      optionRefs.value[0]?.focus();
      break;
    case "End":
      event.preventDefault();
      focusedIndex.value = props.options.length - 1;
      await nextTick();
      optionRefs.value[focusedIndex.value]?.focus();
      break;
  }
};
</script>
