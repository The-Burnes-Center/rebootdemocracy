import { useNuxtApp } from '#app';

export function useDirectusClient() {
  const nuxtApp = useNuxtApp();
  
  return {
    directus: nuxtApp.$directus,
    readItems: nuxtApp.$readItems
  };
}