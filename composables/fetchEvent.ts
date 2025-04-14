// composables/fetchEvent.ts
import { useDirectusClient } from './useDirectusClient';
import type { EventItem, GeneralEventsSeries } from '../types/Event.ts'
import type { Event } from '../types/Event.ts';

export async function fetchIndexData() {
  const { directus, readItems } = useDirectusClient();
  
  try {
    const response = await directus.request(
      readItems('reboot_democracy', {
        meta: 'total_count',
        limit: -1,
        fields: ['*.*'],
      })
    );
    
    return response;
  } catch (error) {
    console.error('Error fetching index data:', error);
    return [];
  }
}

export async function fetchSeriesData(): Promise<GeneralEventsSeries[]> {
  const { directus, readItems } = useDirectusClient();
  
  try {
    const response = await directus.request(
      readItems('general_events_series', {
        meta: 'total_count',
        limit: -1,
        fields: ['*.*'],
      })
    );
    
    return response as GeneralEventsSeries[];
  } catch (error) {
    console.error('Error fetching series data:', error);
    return [];
  }
}

export async function fetchEventsData(): Promise<EventItem[]> {
  const { directus, readItems } = useDirectusClient();
  
  try {
    const response = await directus.request(
      readItems('reboot_democracy_resources', {
        filter: {
          type: {
            _eq: 'Event',
          },
        },
        meta: 'total_count',
        limit: -1,
        sort: ['-date'],
        fields: [
          '*.*',
          'thumbnail.*',
          'partner_logo.*',
          'event_series.general_events_series_id.*',
        ],
      })
    );
    
    return (response as Event[]).map((element) => ({
      event_element: element,
      series_name: 'Reboot Democracy Lecture Series',
    }));
  } catch (error) {
    console.error('Error fetching events data:', error);
    return [];
  }
}