// src/composables/useSearchState.js
import { ref, readonly } from 'vue'

const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])
const isSearching = ref(false)
const indexNames = ref([])
const currentPage = ref(0)
const totalResults = ref(0)

export default function useSearchState() {
  const algoliaClient = useAlgoliaRef()
  
  const setIndexName = (name) => {
    indexNames.value = [name]
  }
  
  const setIndexNames = (names) => {
    if (Array.isArray(names)) {
      indexNames.value = names
    } else {
      indexNames.value = [names]
    }
  }
  
  const updateSearchQuery = async (query) => {
    searchQuery.value = query
    showSearchResults.value = query.trim().length > 0
    currentPage.value = 0;
    
    if (query.trim().length > 0) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    
    if (query.trim().length > 0 && indexNames.value.length > 0) {
      isSearching.value = true
      try {
        const searchPromises = indexNames.value.map(indexName => {
          const index = algoliaClient.initIndex(indexName)
          return index.search(query, {
            page: currentPage.value,
            hitsPerPage: 2
          })
        })
        
        const results = await Promise.all(searchPromises)
        
        let combinedHits = []
        let combinedTotalHits = 0
        
        results.forEach((result, i) => {
          const hitsWithSource = result.hits.map(hit => ({
            ...hit,
            _sourceIndex: indexNames.value[i]
          }))
          
          combinedHits = [...combinedHits, ...hitsWithSource]
          combinedTotalHits += result.nbHits
        })
        
        searchResults.value = combinedHits
        totalResults.value = combinedTotalHits
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
    // Don't proceed if there's no search query or no indices to search
    if (!searchQuery.value || indexNames.value.length === 0) return;
    
    // Don't load more if already searching
    if (isSearching.value) return;
    
    isSearching.value = true
    
    try {
      // Increment the page number
      currentPage.value += 1
      
      const searchPromises = indexNames.value.map(indexName => {
        const index = algoliaClient.initIndex(indexName)
        return index.search(searchQuery.value, {
          page: currentPage.value,
          hitsPerPage: 2
        })
      })
      
      const results = await Promise.all(searchPromises)
      
      // Check if we got any new hits
      const hasNewHits = results.some(result => result.hits.length > 0)
      
      if (hasNewHits) {
        let newHits = []
        
        results.forEach((result, i) => {
          const hitsWithSource = result.hits.map(hit => ({
            ...hit,
            _sourceIndex: indexNames.value[i]
          }))
          
          newHits = [...newHits, ...hitsWithSource]
        })
        
        // Append new hits to existing results
        searchResults.value = [...searchResults.value, ...newHits]
      } else {
        console.log('No more results available')
      }
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
      searchResults.value = []
    }
  }
  
  const resetSearch = () => {
    searchQuery.value = ''
    showSearchResults.value = false
    searchResults.value = []
    isSearching.value = false
    currentPage.value = 0
    totalResults.value = 0
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
    setIndexNames, 
    getAlgoliaClient,
    loadMoreResults,
    totalResults: readonly(totalResults),
    indexNames: readonly(indexNames),
    resetSearch, 
  }
}