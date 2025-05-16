
import { fetchAllUniqueTagsForSSG } from './fetchAllUniqueTagsSSG';
export async function getStaticCategoryRoutes() {
  const tags = await fetchAllUniqueTagsForSSG()
  return tags.map(tag => `/blog/category/${encodeURIComponent(tag)}`)
}
