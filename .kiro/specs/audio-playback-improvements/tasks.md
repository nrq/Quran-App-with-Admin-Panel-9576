# Implementation Plan

- [x] 1. Implement scroll position locking in AyahCard component





  - Modify `handlePlayAudio` to capture and restore scroll position using `window.scrollY` and `window.scrollTo()`
  - Add `requestAnimationFrame` wrapper to ensure scroll restoration happens after React render
  - Add `blur()` call on button element to prevent focus-based scrolling
  - Test that page maintains scroll position when play/pause buttons are clicked
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Add pause/resume functionality to QuranContext






  - [x] 2.1 Add new state variables for pause management

    - Add `isPaused` state variable to track pause status
    - Add `lastPlayedPosition` state variable to store position data
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  

  - [x] 2.2 Implement pauseAudio function

    - Create `pauseAudio()` function that pauses audio without destroying audioRef
    - Set `isPaused` state to true while maintaining `playingAyah` state
    - Ensure audio element's `pause()` method is called
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  
  - [x] 2.3 Implement resumeAudio function

    - Create `resumeAudio()` function that resumes paused audio from current position
    - Set `isPaused` state to false
    - Call audio element's `play()` method
    - _Requirements: 2.3, 2.5_
  
  - [x] 2.4 Modify playAudio function to support pause/resume

    - Update logic to check if same ayah is playing and paused → call resumeAudio
    - Update logic to check if same ayah is playing and not paused → call pauseAudio
    - Keep existing logic for playing new ayah
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.5 Export new functions and state from QuranContext


    - Add `pauseAudio`, `resumeAudio`, and `isPaused` to context value
    - Update context interface for consumers
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Update AyahCard to use pause/resume functionality





  - Destructure `pauseAudio`, `resumeAudio`, and `isPaused` from useQuran hook
  - Update `handlePlayAudio` to call appropriate function based on play/pause state
  - Update button icon to show FiPause when playing, FiPlay when paused or stopped
  - Update button text to show "Pause" when playing, "Resume" when paused, "Play" when stopped
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4. Implement position persistence in QuranContext





  - [x] 4.1 Create position save utility


    - Write function to save reading position to localStorage with key 'quran_reading_position'
    - Include surahNumber, ayahNumber, scrollPosition, timestamp, and isPaused in saved data
    - Add error handling for localStorage quota exceeded and access denied
    - _Requirements: 3.1, 3.2, 3.5, 3.6_
  
  - [x] 4.2 Add auto-save on position changes


    - Create useEffect that triggers when `playingAyah` or `isPaused` changes
    - Extract surah and ayah numbers from `playingAyah` string
    - Capture current scroll position with `window.scrollY`
    - Call save utility with debouncing (500ms) to avoid excessive writes
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 4.3 Implement position restoration on mount


    - Create useEffect that runs once on component mount
    - Read 'quran_reading_position' from localStorage
    - Parse JSON data with error handling for corrupted data
    - Set `lastPlayedPosition` state with restored data
    - Optionally restore scroll position using `window.scrollTo()`
    - _Requirements: 3.3, 3.4_
  
  - [x] 4.4 Add position restoration UI feedback


    - Show toast notification when position is restored on mount
    - Include surah name and ayah number in notification
    - Add "Continue from where you left off" message
    - _Requirements: 3.3_

- [ ]* 5. Add comprehensive tests for new functionality
  - [ ]* 5.1 Write unit tests for QuranContext pause/resume
    - Test `pauseAudio()` maintains audioRef and playingAyah state
    - Test `resumeAudio()` resumes from paused state correctly
    - Test `playAudio()` handles pause/resume logic correctly
    - Test position save to localStorage on playback state changes
    - Test position restore on component mount
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
  -

  - [x] 5.2 Write integration tests for scroll position locking




    - Test scroll position maintained after play button click
    - Test scroll position maintained after pause button click
    - Test scroll position maintained during auto-play next ayah
    - Mock window.scrollY and window.scrollTo for testing
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 5.3 Write tests for localStorage persistence
    - Test position saved correctly with all required fields
    - Test position restored correctly on mount
    - Test error handling for corrupted localStorage data
    - Test error handling for localStorage quota exceeded
    - Test default behavior when no saved position exists
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 6. Verify and validate all requirements
  - Test complete play → pause → resume → stop flow
  - Verify page doesn't scroll during any audio interaction
  - Verify position persists across browser sessions
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on mobile devices for touch interactions
  - _Requirements: All_
