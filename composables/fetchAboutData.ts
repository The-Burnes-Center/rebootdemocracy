// server/services/fetchAllTeamMembers.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { Team } from '@/types/Team';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

// Fetch all team members
export async function fetchTeamData(): Promise<Team[]> {
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
    
    console.log('Team members fetched successfully:', teamMembers.length);
    return teamMembers as Team[];
  } catch (error) {
    console.error('Error fetching team data:', error);
    return [];
  }
}

// Fetch only featured contributors
export async function fetchFeaturedContributors(): Promise<Team[]> {
  try {
    // Since collaborator_type is a JSON field, we need to fetch all and filter client-side
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
    const featured = allMembers.filter((member: any) => {
      if (typeof member.collaborator_type === 'string') {
        return member.collaborator_type === 'featured_contributors';
      }
      if (Array.isArray(member.collaborator_type)) {
        return member.collaborator_type.includes('featured_contributors');
      }
      return false;
    }).slice(0, 9); // Limit to 9 results
    
    console.log('Featured contributors fetched successfully:', featured.length);
    return featured as Team[];
    
  } catch (error) {
    console.error('Error fetching featured contributors:', error);
    return [];
  }
}