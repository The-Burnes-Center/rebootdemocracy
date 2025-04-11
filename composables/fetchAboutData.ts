import type { Team } from '@/types/Team.ts';
import { useDirectusClient } from './useDirectusClient.js';

export async function fetchTeamData(): Promise<Team[]> {
  const { directus, readItems } = useDirectusClient();
  
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
          { Headshot: ['id', 'filename_disk'] }
        ],
      })
    );
    
    return response as Team[];
  } catch (error) {
    console.error('Error fetching team data:', error);
    return [];
  }
}