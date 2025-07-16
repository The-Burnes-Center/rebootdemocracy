<template>
  <div class="about-container">
    <TitleText level="h1" weight="bold" fontFamily="var(--font-inria)">About Us</TitleText>
    <Text margin="md" fontFamily="habibi">We use artificial intelligence to help institutions and communities solve problems together. We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 
      Better governance, Better outcomes, Increased trust in institutions And in one another. As researchers we want to understand how best to “do democracy” in practice. Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.
    </Text>
    
    <div class="team-section">
      <TitleText level="h1" weight="bold" fontFamily="var(--font-inria)">Our Team</TitleText>
      
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
          <div class="member-photo" fontFamily="var(--font-inria)">
            <img
              v-if="member.Headshot"
              :src="getImageUrl(member.Headshot, 512)"
              :alt="`${member.First_Name} ${member.Last_Name}`"
            />
            <div v-else class="photo-placeholder"></div>
          </div>
          
          <div class="member-info">
            <TitleText level="h3" weight="bold" fontFamily="var(--font-sora)" color="text-dark">{{ member.First_Name }} {{ member.Last_Name }}</TitleText>
            <Text 
              as="p" 
              class="member-title" 
              color="text-tertiary" 
              size="sm"
              fontFamily="habibi"
              marginBottom="md"
            >{{ member.Title }}</Text>
            
            <a
              v-if="member.Link_to_bio"
              :href="member.Link_to_bio"
              rel="noopener noreferrer"
              class="bio-link"
            >
              <Text as="span" color="link-primary" weight="medium" size="sm" fontFamily="habibi">View Bio</Text>
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
import { useRoute } from 'vue-router';
import { nextTick } from 'vue'; 

const { data: teamData, pending, error } = await useAsyncData('team-data', fetchTeamData, {
  server: true, 
});

const loading = computed(() => pending.value);
const team = computed(() => teamData.value || []);

const route = useRoute();


// Filter out team members that don't have minimum required information
const validTeamMembers = computed(() =>
  team.value.filter((member) => {
    const hasName = member.First_Name && member.Last_Name;
    const hasHeadshot = member.Headshot?.id;
    const hasBio = member.Link_to_bio?.trim().length > 0;
    return hasName && (hasHeadshot || hasBio);
  })
);

//smooth scroll
watch(pending, async (isLoading) => {
  if (!isLoading && route.hash === '#team-grid') {
    await nextTick();
    const el = document.getElementById('team-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

</script>
