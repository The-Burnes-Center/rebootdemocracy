// blogService.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { NewsItem, WeeklyNews } from '@/types/index.ts';

const API_URL = 'https://directus.theburnescenter.org';
const directus = createDirectus(API_URL).with(rest());

export async function fetchLatestWeeklyNews(): Promise<WeeklyNews | null> {
  try {
    const response = await directus.request<WeeklyNews[]>(
      readItems('reboot_democracy_weekly_news', {
        fields: ['id', 'edition', 'title', 'summary', 'author', 'status'],
        filter: {
          status: { _eq: 'published' }
        },
        sort: ['-id'],
        limit: 1
      })
    );

    if (response && response.length > 0) {
      return response[0];
    } else {
      console.log('No weekly news found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching latest weekly news:', error);
    return null;
  }
}

export async function fetchLatestWeeklyNewsId(): Promise<number | null> {
  try {
    const latestNews = await fetchLatestWeeklyNews();
    return latestNews?.id || null;
  } catch (error) {
    console.error('Error fetching latest weekly news ID:', error);
    return null;
  }
}

export async function fetchWeeklyNewsItems(): Promise<NewsItem[]> {
  try {
    const weeklyNewsEntries = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        limit: -1,
        sort: ['-id'],
        fields: ['id', 'items.reboot_democracy_weekly_news_items_id.*'],
        filter: {
          status: { _eq: 'published' }
        }
      })
    );

    if (!Array.isArray(weeklyNewsEntries) || weeklyNewsEntries.length === 0) {
      return [];
    }

    const allNewsItems: NewsItem[] = [];

    weeklyNewsEntries.forEach((newsEntry) => {
      if (Array.isArray(newsEntry.items)) {
        const itemsFromThisEntry = newsEntry.items
          .map((item: any) => {
            const newsItem = item.reboot_democracy_weekly_news_items_id;
            if (!newsItem) return null;
            return {
              title: newsItem.title,
              excerpt: newsItem.excerpt,
              author: newsItem.author,
              category: newsItem.category,
              date: newsItem.date,
              url: newsItem.url
            };
          })
          .filter(Boolean);

        allNewsItems.push(...itemsFromThisEntry);
      }
    });

    return allNewsItems;
  } catch (error) {
    console.error('Error fetching weekly news items:', error);
    return [];
  }
}
