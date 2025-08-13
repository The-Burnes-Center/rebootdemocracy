import { defineNuxtPlugin, useState } from '#app'
import useSearchState from '~/composables/useSearchState.js'

export default defineNuxtPlugin((nuxtApp) => {
  const routeLoading = useState('routeLoading', () => false)
  const { resetSearch, toggleSearchVisibility } = useSearchState()

  nuxtApp.hook('page:start', () => {
    routeLoading.value = true
    toggleSearchVisibility(false)
    resetSearch()
  })

  nuxtApp.hook('page:finish', () => {
    routeLoading.value = false
  })
})

