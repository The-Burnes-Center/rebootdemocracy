// src/composables/useSearchState.js
import { ref, readonly } from 'vue'
// Shared search state
const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])
const isSearching = ref(false)
const currentIndexName = ref('')
const currentPage = ref(0)
const totalResults = ref(0)

export default function useSearchState() {
  const algoliaClient = useAlgoliaRef()

  const setIndexName = (name) => {
    currentIndexName.value = name
  }

  const updateSearchQuery = async (query) => {
    searchQuery.value = query
    showSearchResults.value = query.trim().length > 0
    currentPage.value = 0;
    if (query.trim().length > 0 && currentIndexName.value) {
      isSearching.value = true
      try {
        const index = algoliaClient.initIndex(currentIndexName.value)
        const result = await index.search(query, {
          page: currentPage.value,
          hitsPerPage: 7
        })
        searchResults.value = result.hits
        totalResults.value = result.nbHits
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

  const loadMoreResults = async () => {
    if (!searchQuery.value || !currentIndexName.value) return;
    isSearching.value = true

    try {
      const index = algoliaClient.initIndex(currentIndexName.value)
      const result = await index.search(searchQuery.value, {
        page: currentPage.value + 1,
        hitsPerPage: 7
      })

      searchResults.value.push(...result.hits)
      currentPage.value += 1
    } catch (error) {
      console.error('Error loading more results:', error)
    } finally {
      isSearching.value = false
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
    getAlgoliaClient,
    loadMoreResults,
    totalResults: readonly(totalResults),

  }
}
