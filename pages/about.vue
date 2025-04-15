<template>
  <div class="about-container">
    <TitleText level="h1" weight="bold">About Us</TitleText>
    <Text margin="md">This is the about page of our application.</Text>
    
    <div class="team-section">
      <TitleText level="h1" weight="bold" >Our Team</TitleText>
      
      <div v-if="loading">
        <Text>Loading team data...</Text>
      </div>
      
      <div v-else-if="error">
        <Text color="text-secondary">Error loading team data. Please try again later.</Text>
      </div>
      
      <div v-else class="team-grid" id="team-grid">
        <!-- Only render team members that have at least name and either headshot or bio -->
        <div 
          v-for="member in validTeamMembers" 
          :key="member.id" 
          class="team-member"
        >
          <div class="member-photo">
            <img
              v-if="member.Headshot"
              :src="getImageUrl(member.Headshot, 512)"
              :alt="`${member.First_Name} ${member.Last_Name}`"
            />
            <div v-else class="photo-placeholder"></div>
          </div>
          
          <div class="member-info">
            <TitleText level="h3" weight="medium">{{ member.First_Name }} {{ member.Last_Name }}</TitleText>
            <Text 
              as="p" 
              class="member-title" 
              fontStyle="italic" 
              color="text-tertiary" 
              size="sm"
              marginBottom="md"
            >{{ member.Title }}</Text>
            
            <a
              v-if="member.Link_to_bio"
              :href="member.Link_to_bio"
              target="_blank"
              rel="noopener noreferrer"
              class="bio-link"
            >
              <Text as="span" color="link-primary" weight="medium" size="sm">View Bio</Text>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Team } from '@/types/Team';
import { fetchTeamData } from '~/composables/fetchAboutData';

const team = ref<Team[]>([]);
const loading = ref(true);
const error = ref(false);
const directusUrl = "https://content.thegovlab.com";
const DIRECTUS_URL = directusUrl;

// Filter out team members that don't have minimum required information
const validTeamMembers = computed(() => {
  return team.value.filter(member => {
    // Must have first and last name
    const hasName = member.First_Name && member.Last_Name;
    
    // Must have either a headshot or a bio link
    const hasHeadshot = member.Headshot && member.Headshot.id;
    const hasBio = member.Link_to_bio && member.Link_to_bio.trim().length > 0;
    
    return hasName && (hasHeadshot || hasBio);
  });
});

onMounted(async () => {
  try {
    team.value = await fetchTeamData();
  } catch (err) {
    console.error('Failed to load team data:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
