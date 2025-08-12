import { defineNuxtPlugin, useState } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const routeLoading = useState('routeLoading', () => false)

  nuxtApp.hook('page:start', () => {
    routeLoading.value = true
  })

  nuxtApp.hook('page:finish', () => {
    routeLoading.value = false
  })
})

