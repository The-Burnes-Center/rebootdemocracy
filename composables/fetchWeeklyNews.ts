// blogService.ts
import type { NewsItem, WeeklyNews } from '@/types/index.ts';
import { useDirectusClient } from './useDirectusClient.js';

/**
 * Fetches the ID of the latest weekly news edition
 * @returns Promise with the latest weekly news ID or null if none found
 */
export async function fetchLatestWeeklyNews(): Promise<WeeklyNews | null> {
  try {
    const { directus, readItems } = useDirectusClient();
        
    const response = await directus.request<WeeklyNews[]>(
      readItems('reboot_democracy_weekly_news', {
        fields: ['id', 'edition', 'title', 'summary', 'author', 'status'],
        filter: {
          status: { _eq: 'published' } 
        },
        sort: ['-id'], // Sort by id in descending order (assuming newer items have higher IDs)
        limit: 1 
      })
    );
    
    if (response && response.length > 0) {
      const latestNews = response[0];
  
      return latestNews;
    } else {
      console.log('No weekly news found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching latest weekly news:', error);
    return null;
  }
}

/**
 * Fetches the ID of the latest weekly news edition
 * @returns Promise with the latest weekly news ID or null if none found
 */
export async function fetchLatestWeeklyNewsId(): Promise<number | null> {
  try {
    const latestNews = await fetchLatestWeeklyNews();
    return latestNews?.id || null;
  } catch (error) {
    console.error('Error fetching latest weekly news ID:', error);
    return null;
  }
}

// Add this function to blogService.ts
export async function fetchWeeklyNewsItems(): Promise<NewsItem[]> {
  try {
    const { directus, readItems } = useDirectusClient();
    
    // Fetch all weekly news entries
    const weeklyNewsEntries = await directus.request(
      readItems("reboot_democracy_weekly_news", {
        limit: -1,
        sort: ["-id"],
        fields: ["id", "items.reboot_democracy_weekly_news_items_id.*"],
        filter: {
          status: { _eq: "published" }
        }
      })
    );
    
    if (!weeklyNewsEntries || !Array.isArray(weeklyNewsEntries) || weeklyNewsEntries.length === 0) {
      return [];
    }
    
    // Collect all news items from all entries
    const allNewsItems: NewsItem[] = [];
    
    weeklyNewsEntries.forEach(newsEntry => {
      if (newsEntry.items && Array.isArray(newsEntry.items)) {
        const itemsFromThisEntry = newsEntry.items.map((item: any) => {
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
        }).filter(Boolean); 
        
        allNewsItems.push(...itemsFromThisEntry);
      }
    });
    
    return allNewsItems;
  } catch (error) {
    console.error("Error fetching weekly news items:", error);
    return [];
  }
}