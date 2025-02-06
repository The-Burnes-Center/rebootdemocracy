// test-fetch.js
import { Directus } from '@directus/sdk';

async function fetchBlogSlugs() {
  try {
    const directus = new Directus('https://dev.thegovlab.com/');
    const { data } = await directus.items('reboot_democracy_blog').readByQuery({
      fields: ['slug'],
      limit: -1,
    });

    if (!data || data.length === 0) {
      console.warn('No data fetched from Directus.');
    } else {
      console.log('Fetched slugs:', data.map((post) => post.slug));
    }
  } catch (error) {
    console.error('Error fetching slugs:', error);
  }
}

fetchBlogSlugs();