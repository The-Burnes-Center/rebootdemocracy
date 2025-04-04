// blogService.ts
import type { WeeklyNews } from '@/types/index.ts';
import { useDirectusClient } from './useDirectusClient.js';

/**
 * Fetches the ID of the latest weekly news edition
 * @returns Promise with the latest weekly news ID or null if none found
 */
export async function fetchLatestWeeklyNews(): Promise<WeeklyNews | null> {
  try {
    const { directus, readItems } = useDirectusClient();
    
    console.log('Fetching latest weekly news...');
    
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
      console.log(`Latest weekly news found:`, latestNews);
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