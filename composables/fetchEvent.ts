// composables/fetchEvent.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { EventItem, GeneralEventsSeries } from '../types/Event.ts';
import type { Event } from '../types/Event.ts';

const API_URL = 'https://content.thegovlab.com';
const directus = createDirectus(API_URL).with(rest());

export async function fetchIndexData() {
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
