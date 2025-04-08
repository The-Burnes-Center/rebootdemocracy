// src/composables/useSearchState.js
import { ref, readonly } from 'vue'

// Shared search state
const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])
const isSearching = ref(false)
const currentIndexName = ref('')

export default function useSearchState() {
  const algoliaClient = useAlgoliaRef()

  const setIndexName = (name) => {
    currentIndexName.value = name
  }

  const updateSearchQuery = async (query) => {
    searchQuery.value = query
    showSearchResults.value = query.trim().length > 0

    if (query.trim().length > 0 && currentIndexName.value) {
      isSearching.value = true
      try {
        const index = algoliaClient.initIndex(currentIndexName.value)
        const result = await index.search(query)
        searchResults.value = result.hits
      } catch (error) {
        console.error('Algolia search error:', error)
        searchResults.value = []
      } finally {
        isSearching.value = false
      }
    } else {
      searchResults.value = []
    }
  }

  const toggleSearchVisibility = (visible) => {
    showSearchResults.value = visible
    if (!visible) {
      searchQuery.value = ''
      getQuery.value = ''
      searchResults.value = []
    }
  }

  const getAlgoliaClient = () => {
    return algoliaClient;
  }

  return {
    searchQuery: readonly(searchQuery),
    showSearchResults: readonly(showSearchResults),
    searchResults: readonly(searchResults),
    isSearching: readonly(isSearching),
    updateSearchQuery,
    toggleSearchVisibility,
    setIndexName, 
    getAlgoliaClient
  }
}
