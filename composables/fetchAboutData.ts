// server/services/fetchAllTeamMembers.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { Team } from '@/types/Team';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

export async function fetchTeamData(): Promise<Team[]> {
  try {
    const response = await directus.request(
      readItems('Reboot_Democracy_team', {
        limit: -1,
        meta: 'total_count',
        fields: [
          'id',
          'First_Name',
          'Last_Name',
          'Title',
          'Link_to_bio',
          { Headshot: ['id', 'filename_disk'] },
        ],
      })
    );
    return response as Team[];
  } catch (error) {
    console.error('Error fetching team data:', error);
    return [];
  }
}