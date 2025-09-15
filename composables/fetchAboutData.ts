// server/services/fetchAllTeamMembers.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { Team } from '@/types/Team';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());


export async function fetchEditorialTeamData(): Promise<Team[]> {
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
    
    // Filter for editorial members (collaborator_type can be a string or array)
    const editorialMembers = allMembers?.filter(member => {
      if (Array.isArray(member.collaborator_type)) {
        return member.collaborator_type.includes('editorial');
      }
      return member.collaborator_type === 'editorial';
    }) || [];
    
    return editorialMembers as Team[];
  } catch (error) {
    console.error('Error fetching editorial team data:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function fetchProductionTeam() : Promise<Team[]> {
  try{
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
    
    // Filter for production members (collaborator_type can be a string or array)
    const productionMembers = allMembers?.filter(member => {
      if (Array.isArray(member.collaborator_type)) {
        return member.collaborator_type.includes('production');
      }
      return member.collaborator_type === 'production';
    }) || [];
    
    return productionMembers as Team[];
  } catch (error) {
    console.error('Error fetching production team data:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function fetchFeaturedContributors(): Promise<Team[]> {
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
    
    const featured = allMembers.filter((member: any) => {
      if (typeof member.collaborator_type === 'string') {
        return member.collaborator_type === 'featured_contributors';
      }
      if (Array.isArray(member.collaborator_type)) {
        return member.collaborator_type.includes('featured_contributors');
      }
      return false;
    }).slice(0, 9); 
    
    console.log('Featured contributors fetched successfully:', featured.length);
    return featured as Team[];
    
  } catch (error) {
    console.error('Error fetching featured contributors:', error);
    return [];
  }
}