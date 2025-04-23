<template>
  <div class="filter-dropdown" @click.stop>
    <label v-if="label" class="filter-dropdown__label">{{ label }}</label>
    <div 
      class="filter-dropdown__select"
      @click="toggleDropdown"
      :class="{ 'filter-dropdown__select--open': isOpen }"
    >
      <span class="filter-dropdown__value">{{ selected }}</span>
      <svg
        class="filter-dropdown__arrow"
        :class="{ 'filter-dropdown__arrow--open': isOpen }"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
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
      >
        <div 
          v-for="option in options" 
          :key="typeof option === 'string' ? option : option.id || option.name"
          class="filter-dropdown__option"
          @click.stop="selectOption(option)"
        >
          {{ typeof option === 'string' ? option : option.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue';

interface TagItem {
  id?: string;
  name: string;
}

type OptionType = string | TagItem;

const props = defineProps({
  options: {
    type: Array as () => OptionType[],
    required: true
  },
  defaultSelected: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['option-selected']);

const isOpen = ref(false);
const selected = ref('');

onMounted(() => {
  if (props.defaultSelected) {
    selected.value = props.defaultSelected;
  } else if (props.options.length > 0) {
    const firstOption = props.options[0];
    selected.value = typeof firstOption === 'string' ? firstOption : firstOption.name;
  }
  
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});

const toggleDropdown = (event: MouseEvent) => {
  event.stopPropagation(); 
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectOption = (option: OptionType) => {
  // Handle both string and object options
  selected.value = typeof option === 'string' ? option : option.name;
  emit('option-selected', option);
  isOpen.value = false;
};
</script>