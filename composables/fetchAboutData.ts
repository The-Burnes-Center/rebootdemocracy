// server/services/fetchAllTeamMembers.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { Team } from '@/types/Team';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

// Fetch all team members
export async function fetchTeamData(): Promise<Team[]> {
  try {
    const response = await directus.request(
      readItems('Reboot_Democracy_team', {
        limit: -1,
        filter: {
          collaborator_type: {
            _contains: ['team']  
          },
        },
        fields: [
          'id',
          'First_Name',
          'Last_Name',
          'Title',
          'Link_to_bio',
          'collaborator_type',
          { Headshot: ['id', 'filename_disk'] },
        ],
      })
    );
    
    console.log('Team members fetched successfully:', response.length);
    return response as Team[];
  } catch (error) {
    console.error('Error fetching team data:', error);
    
    try {
      const allMembers = await directus.request(
        readItems('Reboot_Democracy_team', {
          limit: -1,
          fields: [
            'id',
            'First_Name',
            'Last_Name',
            'Title',
            'Link_to_bio',
            'collaborator_type',
            { Headshot: ['id', 'filename_disk'] },
          ],
        })
      );
      
      // Filter in JavaScript
      const teamMembers = allMembers.filter((member: any) => {
        if (typeof member.collaborator_type === 'string') {
          return member.collaborator_type === 'team';
        }
        if (Array.isArray(member.collaborator_type)) {
          return member.collaborator_type.includes('team');
        }
        return false;
      });
      
      console.log('Team members found (fallback):', teamMembers.length);
      return teamMembers as Team[];
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

// Fetch only featured contributors
export async function fetchFeaturedContributors(): Promise<Team[]> {
  try {
    // Use the _contains operator for array fields
    const response = await directus.request(
      readItems('Reboot_Democracy_team', {
        limit: 9,
        filter: {
          collaborator_type: {
            _contains: ['featured_contributors'],  
          },
        },
        fields: [
          'id',
          'First_Name',
          'Last_Name',
          'Title',
          'Link_to_bio',
          'collaborator_type',
          { Headshot: ['id', 'filename_disk'] },
        ],
      })
    );
    
    console.log('Featured contributors fetched successfully:', response.length);
    return response as Team[];
    
  } catch (error) {
    console.error('Error fetching featured contributors with _contains:', error);
    
    // Fallback: fetch all and filter in JavaScript
    try {
      const allMembers = await directus.request(
        readItems('Reboot_Democracy_team', {
          limit: -1,
          fields: [
            'id',
            'First_Name',
            'Last_Name',
            'Title',
            'Link_to_bio',
            'collaborator_type',
            { Headshot: ['id', 'filename_disk'] },
          ],
        })
      );
      
      // Filter for members who have 'featured_contributors' in their collaborator_type array
      const featured = allMembers.filter((member: any) => 
        Array.isArray(member.collaborator_type) && 
        member.collaborator_type.includes('featured_contributors')
      ).slice(0, 9);
      
      console.log('Featured contributors found (fallback):', featured.length);
      return featured as Team[];
      
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}