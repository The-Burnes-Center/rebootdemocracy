// server/utils/fetchAllUniqueTagsForSSG.ts
import { createDirectus, rest, readItems } from '@directus/sdk';

const API_URL = 'https://directus.theburnescenter.org';

export async function fetchAllUniqueTagsForSSG(): Promise<string[]> {
  try {
    const directus = createDirectus(API_URL).with(rest());

    // --- Fetch all blog posts ---
    const blogPosts = await directus.request(
      readItems('reboot_democracy_blog', {
        filter: {
          status: { _eq: 'published' },
          date: { _lte: '$NOW' },
        },
        fields: ['Tags'],
        limit: -1,
      })
    );

    // --- Fetch all weekly news items ---
    const weeklyNewsEntries = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        filter: {
          status: { _eq: 'published' },
        },
        sort: ['-id'],
        limit: -1,
        fields: ['items.reboot_democracy_weekly_news_items_id.category'],
      })
    );

    // --- Extract tags ---
    const uniqueTags = new Set<string>();

    blogPosts.forEach((post: any) => {
      if (post.Tags && Array.isArray(post.Tags)) {
        post.Tags.forEach(tag => uniqueTags.add(tag));
      }
    });

    weeklyNewsEntries.forEach((entry: any) => {
      if (entry.items && Array.isArray(entry.items)) {
        entry.items.forEach((item: any) => {
          const category = item.reboot_democracy_weekly_news_items_id?.category;
          if (category) uniqueTags.add(category);
        });
      }
    });

    return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('[SSG] Failed to fetch unique tags:', error);
    return [];
  }
}
