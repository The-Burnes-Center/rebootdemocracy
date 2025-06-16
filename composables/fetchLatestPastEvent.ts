// services/eventService.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { Event } from '@/types/Event';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

export async function fetchLatestPastEvent(seriesTitle?: string): Promise<Event | null> {
  try {
    const filter: any = {
      _and: [
        { type: { _eq: 'Event' } },
        { date: { _lt: '$NOW' } }
      ]
    };

    if (seriesTitle) {
      filter._and.push({
        'event_series.general_events_series_id.title': { _eq: seriesTitle }
      });
    }

    const response = await directus.request(
      readItems('reboot_democracy_resources', {
        meta: 'total_count',
        limit: 1,
        sort: ['-date'],
        fields: [
          '*.*',
          'thumbnail.*',
          'partner_logo.*',
          'event_series.general_events_series_id.*'
        ],
        filter
      })
    );

    return response && response.length > 0 ? (response[0] as Event) : null;
  } catch (error) {
    console.error('Error fetching latest past event:', error);
    return null;
  }
}

export async function fetchUpcomingEvent(seriesTitle?: string): Promise<Event | null> {
  try {
    const filter: any = {
      _and: [
        { type: { _eq: 'Event' } },
        { date: { _gte: '$NOW' } }
      ]
    };

    if (seriesTitle) {
      filter._and.push({
        'event_series.general_events_series_id.title': { _eq: seriesTitle }
      });
    }

    const response = await directus.request(
      readItems('reboot_democracy_resources', {
        meta: 'total_count',
        limit: 1,
        sort: ['date'],
        fields: [
          '*.*',
          'thumbnail.*',
          'partner_logo.*',
          'event_series.general_events_series_id.*'
        ],
        filter
      })
    );

    return response && response.length > 0 ? (response[0] as Event) : null;
  } catch (error) {
    console.error('Error fetching upcoming event:', error);
    return null;
  }
}
