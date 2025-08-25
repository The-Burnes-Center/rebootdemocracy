// server/utils/fetchAllUniqueTagsForSSG.ts
import { createDirectus, rest, readItems } from '@directus/sdk';

const API_URL = 'https://burnes-center.directus.app/';

export async function fetchAllUniqueTagsForSSG(): Promise<string[]> {
  try {
    const directus = createDirectus(API_URL).with(rest());

    // Fetch both blog posts and weekly news entries in parallel
    const [blogPosts, weeklyNewsEntries] = await Promise.all([
      // --- Fetch all blog posts ---
      directus.request(
        readItems('reboot_democracy_blog', {
          filter: {
            status: { _eq: 'published' },
            date: { _lte: '$NOW' },
          },
          fields: ['Tags'],
          limit: -1,
        })
      ),
      // --- Fetch weekly news entries (not individual items) ---
      directus.request(
        readItems('reboot_democracy_weekly_news', {
          filter: {
            status: { _eq: 'published' },
            date: { _nnull: true }
          },
          fields: ['id', 'title'], // We just need to know they exist
          limit: -1,
        })
      )
    ]);
    const uniqueTags = new Set<string>();

    blogPosts.forEach((post: any) => {
      if (post.Tags && Array.isArray(post.Tags)) {
        post.Tags.forEach((tag: string) => {
          const normalizedTag = tag.trim();
          uniqueTags.add(normalizedTag);
        });
      }
    });


    return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('[SSG] Failed to fetch unique tags:', error);
    return [];
  }
}