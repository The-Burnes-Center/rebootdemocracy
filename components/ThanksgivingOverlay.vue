<template>
  <div v-if="isThanksgivingSeason" class="thanksgiving-overlay">
    <div 
      v-for="(turkey, index) in turkeys" 
      :key="index"
      class="turkey"
      :class="{ 
        'peeking': turkey.peeking,
        'clickable': turkey.fullyVisible && !turkey.beingPopped
      }"
      :style="turkey.style"
      @click="popTurkey(index)"
    >
      🦃
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isThanksgivingSeason = ref(false)
const turkeys = ref<any[]>([])
let animationFrame: number | null = null

const checkThanksgivingSeason = () => {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()
  
  // Show from November 20th to December 1st (Thanksgiving week)
  isThanksgivingSeason.value = (month === 10 && day >= 20) || (month === 11 && day <= 1)
}

const createTurkey = () => {
  // Randomly choose which side to peek in from
  const sides = ['top', 'bottom', 'left', 'right']
  const side = sides[Math.floor(Math.random() * sides.length)]
  
  // Calculate starting and target positions based on side
  // CRITICAL: Full body must be visible, peek out by exactly body height
  let startLeft = 0
  let startTop = 0
  let targetLeft = 0
  let targetTop = 0
  let rotation = 0
  let transformOrigin = 'center center'
  
  // Size: 50-60px (consistent)
  const size = 50 + Math.random() * 10
  
  // Use pixel-based peek amount (body height in pixels)
  // This ensures consistent positioning regardless of container size
  const peekAmountPx = size // Peek out by exactly body height in pixels
  
  switch (side) {
    case 'top':
      // Come from top: full body visible, peek out by body height
      // Use percentage for horizontal, transform for vertical positioning
      startLeft = 10 + Math.random() * 80 // 10-90% from left (random horizontal)
      targetLeft = startLeft
      // Position at top edge (0%) and use transform to offset by body height
      // This way the bottom of turkey aligns with top edge, body peeks out above
      startTop = 0 // Start at top edge
      targetTop = 0 // End at top edge (will use transform to position)
      rotation = 180 // Face down into image
      transformOrigin = 'center bottom' // Head appears first
      break
      
    case 'bottom':
      // Come from bottom: full body visible, peek out by body height
      startLeft = 10 + Math.random() * 80 // 10-90% from left (random horizontal)
      targetLeft = startLeft
      // Use bottom: 0% to position at bottom edge, then translate down to peek out
      startTop = 0 // Will use bottom: 0% instead
      targetTop = 0 // Will use bottom: 0% instead
      rotation = 0 // Face up into image
      transformOrigin = 'center top' // Head appears first
      break
      
    case 'left':
      // Come from left: full body visible, peek out by body height
      // Use transform for horizontal, percentage for vertical
      startTop = 10 + Math.random() * 80 // 10-90% from top (random vertical)
      targetTop = startTop
      // Position at left edge (0%) and use transform to offset by body height
      startLeft = 0 // Start at left edge
      targetLeft = 0 // End at left edge (will use transform to position)
      rotation = 90 // Face right into image
      transformOrigin = 'right center' // Head appears first
      break
      
    case 'right':
      // Come from right: full body visible, peek out by body height
      startTop = 10 + Math.random() * 80 // 10-90% from top (random vertical)
      targetTop = startTop
      // Position at right edge (100%) and use transform to offset
      startLeft = 100 // Start at right edge
      targetLeft = 100 // End at right edge (will use transform to position)
      rotation = -90 // Face left into image
      transformOrigin = 'left center' // Head appears first
      break
  }
  
  return {
    side: side,
    startLeft: startLeft,
    startTop: startTop,
    targetLeft: targetLeft,
    targetTop: targetTop,
    left: startLeft,
    top: startTop,
    // Ensure consistent animation speed for all sides
    duration: 2000 + Math.random() * 1000, // 2-3 seconds to peek in (consistent speed)
    visibleDuration: 3000 + Math.random() * 4000, // 3-7 seconds visible
    delay: Math.random() * 3000, // 0-3 seconds delay before appearing
    size: size, // Fixed size, no scaling
    rotation: rotation,
    transformOrigin: transformOrigin, // Store transform origin for head-first effect
    peekAmountPx: peekAmountPx, // Store pixel-based peek amount
    peeking: false,
    beingPopped: false,
    fullyVisible: false,
    popStartTime: null,
    startTime: null,
    style: {}
  }
}

const popTurkey = (index: number) => {
  const turkey = turkeys.value[index]
  if (!turkey || turkey.beingPopped || !turkey.fullyVisible) return
  
  // Just disappear immediately - no pop animation
  turkey.beingPopped = true
  turkey.popStartTime = Date.now()
  
  // Remove turkey immediately and create new one
  const now = Date.now()
  const newTurkey = createTurkey()
  newTurkey.startTime = now + newTurkey.delay
  turkeys.value[index] = newTurkey
}


const initTurkeys = () => {
  // Create 6 turkeys - ensure variety from all sides
  for (let i = 0; i < 6; i++) {
    turkeys.value.push(createTurkey())
  }
}

const animateTurkeys = () => {
  if (!isThanksgivingSeason.value) {
    animationFrame = requestAnimationFrame(animateTurkeys)
    return
  }
  
  const now = Date.now()
  
  turkeys.value.forEach((turkey, index) => {
    if (!turkey.startTime) {
      turkey.startTime = now + turkey.delay
    }
    
    const elapsed = now - turkey.startTime
    
    // Before appearing
    if (elapsed < 0) {
      // Calculate start transform offset (off-screen)
      const startTranslateX = turkey.side === 'left' ? -turkey.peekAmountPx - 30 :
                              turkey.side === 'right' ? turkey.peekAmountPx + 30 : 0
      const startTranslateY = turkey.side === 'top' ? -turkey.peekAmountPx - 30 :
                              turkey.side === 'bottom' ? turkey.peekAmountPx + 30 : 0
      
      const beforeStyle: any = {
        fontSize: `${turkey.size}px`,
        opacity: 1, // No fade - always visible
        transform: `translate(${startTranslateX}px, ${startTranslateY}px) rotate(${turkey.rotation}deg)`,
        transition: 'none',
        willChange: 'transform' // Optimize for smooth animation
      }
      
      // Position at edges: Each side positioned so edge aligns with container edge
      // Start position is further out (off-screen)
      // Top: Start at top: -bodyHeight - 30px (off-screen above)
      const startOffset = turkey.peekAmountPx + 30 // Further out for animation start
      if (turkey.side === 'top') {
        beforeStyle.top = `-${startOffset}px` // Start off-screen above
        beforeStyle.left = `${turkey.targetLeft}%`
      } else if (turkey.side === 'bottom') {
        beforeStyle.bottom = `-${startOffset}px`
        beforeStyle.left = `${turkey.targetLeft}%`
      } else if (turkey.side === 'left') {
        beforeStyle.left = `-${startOffset}px`
        beforeStyle.top = `${turkey.targetTop}%`
      } else if (turkey.side === 'right') {
        beforeStyle.right = `-${startOffset}px`
        beforeStyle.top = `${turkey.targetTop}%`
      }
      
      turkey.style = beforeStyle
      turkey.peeking = false
      return
    }
    
    // If being clicked, just disappear immediately (no animation)
    if (turkey.beingPopped) {
      // Already replaced in popTurkey function, this shouldn't be reached
      return
    }
    
    // Peeking in phase (0 to duration)
    const peekProgress = Math.min(elapsed / turkey.duration, 1)
    
    // Visible phase (duration to duration + visibleDuration)
    const totalDuration = turkey.duration + turkey.visibleDuration
    const visibleProgress = Math.min(elapsed / totalDuration, 1)
    
    // If past visible duration, reset
    if (visibleProgress >= 1) {
      const newTurkey = createTurkey()
      newTurkey.startTime = now + newTurkey.delay
      turkeys.value[index] = newTurkey
      return
    }
    
    // During peek animation (sliding in from edge, head first, fixed size)
    if (peekProgress < 1) {
      turkey.peeking = true
      turkey.fullyVisible = false
      
      // Use easing for more natural movement
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(peekProgress)
      
      // Start position transform (off-screen, further out)
      // Top: Start further UP (more negative) and move DOWN (towards 0) to peek in
      const peekInAmountTop = 8 + Math.random() * 2 // 8-10px visible for top (just head)
      const peekInAmountOther = 12 + Math.random() * 3 // 12-15px for other sides
      
      // For top: Start further out (more negative), end at target position (less negative)
      const topStartTranslateY = -(turkey.peekAmountPx + 30) // Start further up/outside
      const topTargetTranslateY = -(turkey.peekAmountPx - peekInAmountTop) // End position (pulled back)
      
      const startOffset = 30 // Additional offset for animation start
      const startTranslateX = turkey.side === 'left' ? -startOffset : 
                              turkey.side === 'right' ? startOffset : 0
      const startTranslateY = turkey.side === 'top' ? topStartTranslateY : // Start further up for top
                              turkey.side === 'bottom' ? startOffset : 0
      
      const targetTranslateX = turkey.side === 'left' ? peekInAmountOther : // Small translate right
                               turkey.side === 'right' ? -peekInAmountOther : // Small translate left
                               0
      // Top: Move from further up to target position (downward movement)
      const targetTranslateY = turkey.side === 'top' ? topTargetTranslateY : // Move down to peek in
                              turkey.side === 'bottom' ? -peekInAmountOther : // Small translate up
                              0
      
      // Interpolate transform
      const translateX = startTranslateX + (easedProgress * (targetTranslateX - startTranslateX))
      const translateY = startTranslateY + (easedProgress * (targetTranslateY - startTranslateY))
      
      // Position at edges - no opacity fade, just movement
      const positionStyle: any = {
        fontSize: `${turkey.size}px`,
        opacity: 1, // No fade - always fully visible
        transform: `translate(${translateX}px, ${translateY}px) rotate(${turkey.rotation}deg)`,
        transformOrigin: turkey.transformOrigin, // Head-first transform origin
        transition: 'none',
        willChange: 'transform' // Optimize for smooth animation
      }
      
      // Position at edges: Each side positioned so the opposite edge aligns with container edge
      // Top: Position bottom of turkey at top edge (top: -bodyHeight), then translate UP to pull back
      // Bottom: Position so top is at bottom edge: bottom: -bodyHeight
      // Left: Position so right edge is at left edge: left: -bodyHeight
      // Right: Position so left edge is at right edge: right: -bodyHeight
      if (turkey.side === 'top') {
        positionStyle.top = `-${turkey.peekAmountPx}px` // Bottom of turkey at top edge
        positionStyle.left = `${turkey.targetLeft}%`
      } else if (turkey.side === 'bottom') {
        positionStyle.bottom = `-${turkey.peekAmountPx}px` // Top of turkey at bottom edge
        positionStyle.left = `${turkey.targetLeft}%`
      } else if (turkey.side === 'left') {
        positionStyle.left = `-${turkey.peekAmountPx}px` // Right edge of turkey at left edge
        positionStyle.top = `${turkey.targetTop}%`
      } else if (turkey.side === 'right') {
        positionStyle.right = `-${turkey.peekAmountPx}px` // Left edge of turkey at right edge
        positionStyle.top = `${turkey.targetTop}%`
      }
      
      turkey.style = positionStyle
    } else {
      // Fully visible phase or reverse animation (going back)
      const fadeOutStart = 0.75 // Start reversing at 75% of visible time
      
      if (visibleProgress < fadeOutStart) {
        // Fully visible phase (standing on edge, partially visible)
        turkey.peeking = false
        turkey.fullyVisible = true
        
        // Calculate transform offset for peeking position
        // Top: Position bottom at edge, translate UP to pull back - only 8-10px visible
        const peekInAmountTop = 8 + (turkey.size - 50) * 0.1 // 8-9px visible for top
        const peekInAmountOther = 12 + (turkey.size - 50) * 0.1 // 12-13px for other sides
        
        const translateX = turkey.side === 'left' ? peekInAmountOther :
                          turkey.side === 'right' ? -peekInAmountOther : 0
        // Top: Translate UP (negative) to pull turkey back so only peekInAmountTop is visible
        const translateY = turkey.side === 'top' ? -(turkey.peekAmountPx - peekInAmountTop) : // Translate up to pull back
                          turkey.side === 'bottom' ? -peekInAmountOther : 0
        
        // Shake/bob animation while visible (prairie dog behavior) - smoother calculation
        const shakeTime = now * 0.003 // Slower, smoother timing
        const shakeAmount = 2 // Slightly more shake
        // Use different frequencies for X and Y to create more natural shake
        const shakeOffsetX = turkey.side === 'left' || turkey.side === 'right' 
          ? (Math.sin(shakeTime * 1.3) * 0.5 + Math.sin(shakeTime * 2.1) * 0.5) * shakeAmount
          : 0
        const shakeOffsetY = turkey.side === 'top' || turkey.side === 'bottom'
          ? (Math.sin(shakeTime * 1.1) * 0.5 + Math.sin(shakeTime * 1.9) * 0.5) * shakeAmount
          : 0
        
        const visibleStyle: any = {
          fontSize: `${turkey.size}px`,
          opacity: 1, // No fade
          transform: `translate(${translateX + shakeOffsetX}px, ${translateY + shakeOffsetY}px) rotate(${turkey.rotation}deg)`,
          transformOrigin: turkey.transformOrigin, // Maintain head-first orientation
          transition: 'none',
          willChange: 'transform', // Optimize for smooth animation
          cursor: 'pointer'
        }
        
        // Position at edges: Each side positioned so the opposite edge aligns with container edge
        // Top: Position bottom of turkey at top edge
        if (turkey.side === 'top') {
          visibleStyle.top = `-${turkey.peekAmountPx}px` // Bottom of turkey at top edge
          visibleStyle.left = `${turkey.targetLeft}%`
        } else if (turkey.side === 'bottom') {
          visibleStyle.bottom = `-${turkey.peekAmountPx}px` // Top of turkey at bottom edge
          visibleStyle.left = `${turkey.targetLeft}%`
        } else if (turkey.side === 'left') {
          visibleStyle.left = `-${turkey.peekAmountPx}px` // Right edge of turkey at left edge
          visibleStyle.top = `${turkey.targetTop}%`
        } else if (turkey.side === 'right') {
          visibleStyle.right = `-${turkey.peekAmountPx}px` // Left edge of turkey at right edge
          visibleStyle.top = `${turkey.targetTop}%`
        }
        
        turkey.style = visibleStyle
      } else {
        // Reverse animation - go back the way they came
        turkey.peeking = true
        turkey.fullyVisible = false
        
        const reverseProgress = (visibleProgress - fadeOutStart) / (1 - fadeOutStart) // 0 to 1
        const easeInCubic = (t: number) => t * t * t // Reverse easing (opposite of easeOut)
        const easedReverse = easeInCubic(reverseProgress)
        
        // Calculate transform offsets for reverse
        // Top: Move back from peek position to further up/outside
        const peekInAmountTop = 8 + (turkey.size - 50) * 0.1 // 8-9px visible for top
        const peekInAmountOther = 12 + (turkey.size - 50) * 0.1 // 12-13px for other sides
        
        // For top: Start at peek position, move back to further up/outside
        const topTargetTranslateY = -(turkey.peekAmountPx - peekInAmountTop) // Current peek position
        const topStartTranslateY = -(turkey.peekAmountPx + 30) // Move back further up/outside
        
        const targetTranslateX = turkey.side === 'left' ? peekInAmountOther :
                                turkey.side === 'right' ? -peekInAmountOther : 0
        const targetTranslateY = turkey.side === 'top' ? topTargetTranslateY : // Current position
                                turkey.side === 'bottom' ? -peekInAmountOther : 0
        
        const startOffset = 30 // Additional offset for reverse animation start
        const startTranslateX = turkey.side === 'left' ? -startOffset :
                               turkey.side === 'right' ? startOffset : 0
        const startTranslateY = turkey.side === 'top' ? topStartTranslateY : // Move back further up
                               turkey.side === 'bottom' ? startOffset : 0
        
        // Move back from target to start position
        const translateX = targetTranslateX + (easedReverse * (startTranslateX - targetTranslateX))
        const translateY = targetTranslateY + (easedReverse * (startTranslateY - targetTranslateY))
        
        // No fade - just movement
        const reverseStyle: any = {
          fontSize: `${turkey.size}px`,
          opacity: 1, // No fade
          transform: `translate(${translateX}px, ${translateY}px) rotate(${turkey.rotation}deg)`,
          transformOrigin: turkey.transformOrigin,
          transition: 'none',
          willChange: 'transform' // Optimize for smooth animation
        }
        
        // Position at edges: Each side positioned so the opposite edge aligns with container edge
        // Top: Position bottom of turkey at top edge
        if (turkey.side === 'top') {
          reverseStyle.top = `-${turkey.peekAmountPx}px` // Bottom of turkey at top edge
          reverseStyle.left = `${turkey.targetLeft}%`
        } else if (turkey.side === 'bottom') {
          reverseStyle.bottom = `-${turkey.peekAmountPx}px` // Top of turkey at bottom edge
          reverseStyle.left = `${turkey.targetLeft}%`
        } else if (turkey.side === 'left') {
          reverseStyle.left = `-${turkey.peekAmountPx}px` // Right edge of turkey at left edge
          reverseStyle.top = `${turkey.targetTop}%`
        } else if (turkey.side === 'right') {
          reverseStyle.right = `-${turkey.peekAmountPx}px` // Left edge of turkey at right edge
          reverseStyle.top = `${turkey.targetTop}%`
        }
        
        turkey.style = reverseStyle
      }
    }
  })
  
  animationFrame = requestAnimationFrame(animateTurkeys)
}

onMounted(() => {
  checkThanksgivingSeason()
  if (isThanksgivingSeason.value) {
    initTurkeys()
  }
  animateTurkeys()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped>
.thanksgiving-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  overflow: visible; /* Allow turkeys to peek out from edges - image wrapper will clip them */
}

.turkey {
  position: absolute;
  user-select: none;
  pointer-events: none;
  will-change: transform, filter; /* Optimize for smooth animation */
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
  transform-origin: center center;
  /* Sparkling magic glow effect */
  animation: sparkleGlow 3s ease-in-out infinite;
  transition: none; /* No transitions - all animation via JS for smoothness */
  backface-visibility: hidden; /* Prevent flicker */
  -webkit-font-smoothing: antialiased; /* Smooth text rendering */
}

.turkey.clickable {
  pointer-events: auto;
  cursor: pointer;
}

.turkey.clickable:hover {
  /* Only change filter/opacity to avoid transform conflicts with inline styles */
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))
          drop-shadow(0 0 12px rgba(255, 165, 0, 0.8));
  opacity: 0.9;
}


/* Sparkling magic glow animation */
@keyframes sparkleGlow {
  0%, 100% {
    text-shadow: 
      0 0 5px rgba(255, 215, 0, 0.8),
      0 0 10px rgba(255, 165, 0, 0.6),
      0 0 15px rgba(255, 140, 0, 0.4),
      0 0 20px rgba(255, 215, 0, 0.3),
      2px 2px 0px rgba(255, 255, 255, 0.2),
      -2px -2px 0px rgba(255, 255, 255, 0.2);
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))
            drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))
            drop-shadow(0 0 12px rgba(255, 165, 0, 0.4));
  }
  25% {
    text-shadow: 
      0 0 8px rgba(255, 192, 203, 0.9),
      0 0 12px rgba(255, 165, 0, 0.7),
      0 0 18px rgba(255, 140, 0, 0.5),
      0 0 25px rgba(255, 215, 0, 0.4),
      3px 3px 0px rgba(255, 255, 255, 0.3),
      -3px -3px 0px rgba(255, 255, 255, 0.3);
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))
            drop-shadow(0 0 10px rgba(255, 192, 203, 0.7))
            drop-shadow(0 0 15px rgba(255, 165, 0, 0.5));
  }
  50% {
    text-shadow: 
      0 0 6px rgba(255, 255, 255, 0.9),
      0 0 12px rgba(255, 215, 0, 0.8),
      0 0 18px rgba(255, 165, 0, 0.6),
      0 0 24px rgba(255, 140, 0, 0.4),
      2px 2px 0px rgba(255, 215, 0, 0.4),
      -2px -2px 0px rgba(255, 215, 0, 0.4);
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))
            drop-shadow(0 0 12px rgba(255, 255, 255, 0.8))
            drop-shadow(0 0 18px rgba(255, 215, 0, 0.6));
  }
  75% {
    text-shadow: 
      0 0 7px rgba(255, 215, 0, 0.9),
      0 0 14px rgba(255, 192, 203, 0.7),
      0 0 20px rgba(255, 165, 0, 0.5),
      0 0 26px rgba(255, 140, 0, 0.4),
      2px 2px 0px rgba(255, 255, 255, 0.3),
      -2px -2px 0px rgba(255, 255, 255, 0.3);
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))
            drop-shadow(0 0 11px rgba(255, 215, 0, 0.7))
            drop-shadow(0 0 16px rgba(255, 192, 203, 0.5));
  }
}
</style>

