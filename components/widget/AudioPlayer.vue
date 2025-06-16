<template>
  <div class="audio-player">
    <button
      class="audio-player__play-button"
      @click="togglePlay"
      :aria-label="isPlaying ? 'Pause' : 'Play'"
    >
      <img
        :src="isPlaying ? '/images/PauseButton.svg' : '/images/PlayButton.svg'"
        alt="Play/Pause Button"
      />
    </button>

    <div class="audio-player__controls">
      <div class="audio-player__time current-time">
        {{ formatTime(currentTime) }}
      </div>

      <div class="audio-player__progress-container" @click="seek">
        <div
          class="audio-player__progress-bar"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>

      <div class="audio-player__time total-time">
        {{ formatTime(duration) }}
      </div>
    </div>

    <button
      class="audio-player__volume-button"
      @click="toggleMute"
      :aria-label="isMuted ? 'Unmute' : 'Mute'"
    >
      <img
        :src="isMuted ? '/images/MuteButton.svg' : '/images/VolumeButton.svg'"
        alt="Volume Button"
      />
    </button>

    <!-- Hidden audio element -->
    <audio
      ref="audioElement"
      :src="validAudioSrc"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";

interface AudioPlayerProps {
  audioSrc: string;
  autoplay?: boolean;
}

const props = withDefaults(defineProps<AudioPlayerProps>(), {
  audioSrc: "",
  autoplay: false,
});

// Make sure we have a valid audio URL that works with the player
const validAudioSrc = computed(() => {
  if (!props.audioSrc) return "";

  // If URL already has https:// prefix, use it as is
  if (props.audioSrc.startsWith("http")) {
    return props.audioSrc;
  }

  // Otherwise, ensure it has the proper Directus base URL
  return `https://burnes-center.directus.app//assets/${props.audioSrc.replace(
    /^\//,
    ""
  )}`;
});

// Refs
const audioElement = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const currentTime = ref(0);
const duration = ref(0);

// Computed values
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

// Event handlers
const togglePlay = () => {
  if (!audioElement.value) return;

  if (isPlaying.value) {
    audioElement.value.pause();
  } else {
    audioElement.value.play();
  }

  isPlaying.value = !isPlaying.value;
};

const toggleMute = () => {
  if (!audioElement.value) return;

  audioElement.value.muted = !audioElement.value.muted;
  isMuted.value = audioElement.value.muted;
};

const seek = (event: MouseEvent) => {
  if (!audioElement.value) return;

  const progressContainer = event.currentTarget as HTMLElement;
  const rect = progressContainer.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const clickPositionPercentage = (offsetX / rect.width) * 100;

  const seekTime = (clickPositionPercentage / 100) * duration.value;
  audioElement.value.currentTime = seekTime;
  currentTime.value = seekTime;
};

const onTimeUpdate = () => {
  if (!audioElement.value) return;
  currentTime.value = audioElement.value.currentTime;
};

const onLoadedMetadata = () => {
  if (!audioElement.value) return;
  duration.value = audioElement.value.duration;
};

const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

// Format time to MM:SS
const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return "00:00";

  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

// Lifecycle hooks
onMounted(() => {
  if (process.client && props.autoplay && audioElement.value) {
    audioElement.value
      .play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch((error) => {
        console.error("Autoplay failed:", error);
      });
  }
});

// Watch for src changes
watch(
  () => props.audioSrc,
  (newSrc) => {
    if (newSrc && audioElement.value) {
      // Reset the player
      currentTime.value = 0;
      isPlaying.value = false;

      // Load the new audio
      audioElement.value.load();
    }
  }
);
</script>
