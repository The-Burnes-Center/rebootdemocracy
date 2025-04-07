<template>
  <div class="tags-test">
    <h2>Tags Fetch Test</h2>
    
    <div v-if="isLoading" class="loading">
      Loading tags...
    </div>
    
    <div v-else-if="error" class="error">
      Error: {{ error }}
    </div>
    
    <div v-else>
      <h3>Available Tags: {{ tags.length }}</h3>
      <ul class="tags-list">
        <li v-for="tag in tags" :key="tag.id" class="tag-item">
          {{ tag.name }}
          <button @click="fetchPostCount(tag.id)" class="count-btn">
            Get Post Count
          </button>
          <span v-if="tag.count !== undefined" class="tag-count">
            ({{ tag.count }} posts)
          </span>
        </li>
      </ul>
      
      <div class="raw-data">
        <h3>Raw API Response:</h3>
        <pre>{{ JSON.stringify(rawTagsResponse, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Tag {
  id: string;
  name: string;
  count?: number;
}

const directusUrl = "https://content.thegovlab.com";
const tags = ref<Tag[]>([]);
const rawTagsResponse = ref(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch all available tags
const fetchTags = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    // Get all tags
    const response = await fetch(
      `${directusUrl}/items/Tags?fields=id,name`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    rawTagsResponse.value = data; // Store raw response for debugging
    
    // Process tags
    if (data.data && Array.isArray(data.data)) {
      tags.value = data.data.map((tag: any) => ({
        id: tag.id,
        name: tag.name
      }));
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (err: any) {
    console.error('Error fetching tags:', err);
    error.value = err.message || 'Failed to fetch tags';
  } finally {
    isLoading.value = false;
  }
};

// Fetch the post count for a specific tag
const fetchPostCount = async (tagId: string) => {
  try {
    // Find the tag in our array
    const tagIndex = tags.value.findIndex(tag => tag.id === tagId);
    if (tagIndex === -1) return;
    
    // Make API call to count posts with this tag
    const response = await fetch(
      `${directusUrl}/items/BlogPosts?filter[Tags][_contains]=${tagId}&aggregate[count]=*`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post count: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Post count response:', data);
    
    // Update tag with count
    const count = data.data?.[0]?.count || 0;
    tags.value[tagIndex] = { 
      ...tags.value[tagIndex], 
      count 
    };
  } catch (err) {
    console.error(`Error fetching post count for tag ${tagId}:`, err);
  }
};

// Check if a different filter syntax is needed
const testAlternativeFilter = async () => {
  try {
    if (tags.value.length === 0) return;
    
    const tagId = tags.value[0].id;
    console.log(`Testing alternative filter for tag ${tagId}`);
    
    // Try different filter syntax
    const response = await fetch(
      `${directusUrl}/items/BlogPosts?filter[Tags][_in]=${tagId}&aggregate[count]=*`
    );
    
    if (!response.ok) {
      throw new Error(`Alternative filter failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Alternative filter response:', data);
  } catch (err) {
    console.error('Error testing alternative filter:', err);
  }
};

onMounted(async () => {
  await fetchTags();
  if (tags.value.length > 0) {
    // Test alternative filter after tags are loaded
    await testAlternativeFilter();
  }
});
</script>

<style scoped>
.tags-test {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.loading, .error {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
}

.loading {
  background-color: #f0f0f0;
}

.error {
  background-color: #fff0f0;
  color: #d00;
}

.tags-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.tag-item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #eee;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.count-btn {
  margin-left: 1rem;
  padding: 0.25rem 0.5rem;
  background-color: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.tag-count {
  margin-left: 0.5rem;
  color: #666;
}

.raw-data {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 4px;
  overflow-x: auto;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>