# Design Document

## Overview

This design addresses three critical audio playback issues in the Quran application:
1. Page jumping to top when playing/pausing audio
2. Inability to pause ayat playback
3. Loss of reading position when closing the page

The solution involves modifying the QuranContext audio playback logic, preventing scroll behavior in event handlers, and implementing localStorage-based position persistence.

## Architecture

### Current State Analysis

The application uses:
- **QuranContext**: Manages audio playback state with `audioRef`, `playingAyah`, and `currentAudio`
- **AyahCard Component**: Renders individual ayat with play/pause buttons
- **Audio Element**: HTML5 Audio API for playback
- **Event Handlers**: `handlePlayAudio` in AyahCard with `preventDefault()` and `stopPropagation()`

### Root Causes

1. **Page Scrolling**: Despite `preventDefault()` in AyahCard, the audio element or state updates may trigger React re-renders that cause scroll resets
2. **Pause Not Working**: The `playAudio` function toggles between play and stop, but the button shows "Stop" instead of "Pause", and clicking it calls `stopAudio()` which fully stops playback
3. **No Position Persistence**: No mechanism exists to save/restore the current surah, ayah, and scroll position

## Components and Interfaces

### 1. QuranContext Modifications

**New State Variables:**
```javascript
const [isPaused, setIsPaused] = useState(false);
const [lastPlayedPosition, setLastPlayedPosition] = useState(null);
```

**Modified Functions:**

```javascript
// Enhanced playAudio with pause support
playAudio(surahNumber, ayahNumber, autoPlayNext = true)
// - Check if same ayah and paused → resume
// - Check if same ayah and playing → pause (not stop)
// - Otherwise → play new ayah
// - Save position to localStorage

// New pauseAudio function
pauseAudio()
// - Pause current audio without destroying audioRef
// - Set isPaused state to true
// - Keep playingAyah state intact

// New resumeAudio function
resumeAudio()
// - Resume paused audio from current position
// - Set isPaused state to false

// Enhanced stopAudio
stopAudio()
// - Fully stop and cleanup audio
// - Clear playingAyah and isPaused states
```

**Position Persistence:**
```javascript
// Save position structure
{
  surahNumber: number,
  ayahNumber: number,
  scrollPosition: number,
  timestamp: number,
  isPaused: boolean
}

// Save to localStorage key: 'quran_reading_position'
```

### 2. AyahCard Component Modifications

**Updated Event Handler:**
```javascript
const handlePlayAudio = (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Prevent any scroll behavior
  if (e.target) {
    e.target.blur(); // Remove focus that might cause scroll
  }
  
  if (isPlaying && !isPaused) {
    pauseAudio(); // Pause instead of stop
  } else if (isPlaying && isPaused) {
    resumeAudio(); // Resume from pause
  } else {
    playAudio(surahNumber, verse.verse_number);
  }
};
```

**Button Display Logic:**
```javascript
// Show appropriate icon based on state
const buttonIcon = isPlaying && !isPaused ? FiPause : FiPlay;
const buttonText = isPlaying && !isPaused ? 'Pause' : 
                   isPlaying && isPaused ? 'Resume' : 'Play';
```

### 3. Position Restoration Hook

**New useEffect in QuranContext:**
```javascript
useEffect(() => {
  // On mount, restore last position
  const savedPosition = localStorage.getItem('quran_reading_position');
  if (savedPosition) {
    const position = JSON.parse(savedPosition);
    setLastPlayedPosition(position);
    // Optionally navigate to that surah/ayah
  }
}, []);
```

**New useEffect for Auto-Save:**
```javascript
useEffect(() => {
  // Save position whenever playingAyah changes
  if (playingAyah) {
    const [surahNumber, ayahNumber] = playingAyah.split(':').map(Number);
    const position = {
      surahNumber,
      ayahNumber,
      scrollPosition: window.scrollY,
      timestamp: Date.now(),
      isPaused
    };
    localStorage.setItem('quran_reading_position', JSON.stringify(position));
  }
}, [playingAyah, isPaused]);
```

### 4. Scroll Prevention Strategy

**Multiple Layers of Protection:**

1. **Event Level**: `preventDefault()` and `stopPropagation()` on click events
2. **Focus Management**: Call `blur()` on button after click to prevent focus-based scrolling
3. **Scroll Lock**: Temporarily save and restore scroll position around state updates
4. **CSS**: Ensure no `scroll-behavior: smooth` interferes with position locking

**Implementation in AyahCard:**
```javascript
const handlePlayAudio = (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Lock scroll position
  const currentScroll = window.scrollY;
  
  // Perform audio action
  // ... audio logic ...
  
  // Restore scroll position after React render
  requestAnimationFrame(() => {
    window.scrollTo(0, currentScroll);
  });
};
```

## Data Models

### Reading Position Model
```typescript
interface ReadingPosition {
  surahNumber: number;
  ayahNumber: number;
  scrollPosition: number;
  timestamp: number;
  isPaused: boolean;
}
```

### Audio State Model
```typescript
interface AudioState {
  playingAyah: string | null;  // "surahNumber:ayahNumber"
  isPaused: boolean;
  currentAudio: HTMLAudioElement | null;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}
```

## Error Handling

### Audio Playback Errors
- **Network Failure**: Show toast error, don't save position
- **Audio Load Error**: Fallback to default URL pattern, retry once
- **Pause/Resume Error**: Log error, reset audio state to stopped

### LocalStorage Errors
- **Quota Exceeded**: Clear old positions, keep only latest
- **Parse Error**: Clear corrupted data, start fresh
- **Access Denied**: Gracefully degrade, continue without persistence

### Scroll Position Errors
- **Invalid Position**: Default to top of page
- **Scroll Lock Failure**: Log warning, continue without lock

## Testing Strategy

### Unit Tests
1. **QuranContext**:
   - Test `pauseAudio()` maintains audioRef and playingAyah
   - Test `resumeAudio()` resumes from paused state
   - Test position save to localStorage on playback
   - Test position restore on mount

2. **AyahCard**:
   - Test button shows correct icon/text for each state
   - Test scroll position maintained after click
   - Test event handlers prevent default behavior

### Integration Tests
1. **Audio Playback Flow**:
   - Play → Pause → Resume → Stop sequence
   - Auto-play next ayah after current ends
   - Position saved at each state change

2. **Position Persistence**:
   - Save position, reload page, verify restoration
   - Multiple sessions maintain correct position
   - Scroll position restored accurately

### Manual Testing Checklist
1. Play audio, verify page doesn't scroll
2. Pause audio mid-playback, verify it pauses
3. Resume paused audio, verify it continues
4. Close browser, reopen, verify position restored
5. Test on mobile devices for touch event handling
6. Test with keyboard navigation (space bar, enter)

## Implementation Notes

### Performance Considerations
- Debounce localStorage writes to avoid excessive I/O
- Use `requestAnimationFrame` for scroll position restoration
- Minimize re-renders by using refs for scroll position

### Browser Compatibility
- HTML5 Audio API supported in all modern browsers
- localStorage available in all target browsers
- Test scroll lock on Safari (known issues with scroll restoration)

### Accessibility
- Ensure keyboard navigation works with pause/resume
- Screen readers announce correct button state
- Focus management doesn't interfere with assistive tech

### Future Enhancements
- Sync position across devices (requires backend)
- Remember multiple bookmarks
- Playback speed control
- Background audio playback (PWA feature)
