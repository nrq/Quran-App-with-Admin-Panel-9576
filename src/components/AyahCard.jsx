import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuran } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiVolume2, FiBook } = FiIcons;

const AyahCard = ({ verse, surahNumber, index }) => {
  const quranContext = useQuran();
  const { playAudio, pauseAudio, resumeAudio, playingAyah, isPaused, getTafseer } = quranContext;
  const [showTafseer, setShowTafseer] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(true);
  const ayahKey = `${surahNumber}:${verse.verse_number}`;
  const isPlaying = playingAyah === ayahKey;
  const tafseerText = getTafseer(surahNumber, verse.verse_number);

  // DEBUG: Track AyahCard re-renders - only log if this ayah is affected
  if (isPlaying || playingAyah === null) {
    console.log(`🔄 [AyahCard ${ayahKey}] Re-rendered - isPlaying: ${isPlaying}, isPaused: ${isPaused}`);
  }

  // Global scroll lock mechanism
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout;
    let isScrollLocked = false;

    // Create global scroll lock functions
    window.lockScroll = (position) => {
      isScrollLocked = true;
      console.log(`🔒 [ScrollLock] Locking scroll at position: ${position}`);
      
      const restorePosition = () => {
        if (isScrollLocked) {
          window.scrollTo({
            top: position,
            left: 0,
            behavior: 'instant'
          });
        }
      };
      
      // Aggressive restoration
      restorePosition();
      requestAnimationFrame(restorePosition);
      setTimeout(restorePosition, 0);
      setTimeout(restorePosition, 10);
      setTimeout(restorePosition, 50);
      setTimeout(restorePosition, 100);
      setTimeout(restorePosition, 200);
      
      // Auto-unlock after 500ms
      setTimeout(() => {
        isScrollLocked = false;
        console.log(`🔓 [ScrollLock] Unlocking scroll`);
      }, 500);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = Math.abs(currentScrollY - lastScrollY);
      
      // Only log significant scroll jumps
      if (scrollDiff > 100) {
        console.log(`📜 [Scroll] Large scroll jump detected: ${lastScrollY} → ${currentScrollY} (diff: ${scrollDiff})`);
      }
      
      lastScrollY = currentScrollY;
      
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set new timeout to detect scroll end
      scrollTimeout = setTimeout(() => {
        console.log(`📜 [Scroll] Scroll ended at: ${window.scrollY}`);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      delete window.lockScroll;
    };
  }, []);

  const handlePlayAudio = () => {
    // CAPTURE scroll position BEFORE any state changes
    const scrollBefore = window.scrollY;
    console.log(`🎵 [AyahCard] Play button clicked - Scroll before: ${scrollBefore}`);
    
    // Use global scroll lock to prevent jumping during re-renders
    if (window.lockScroll) {
      window.lockScroll(scrollBefore);
    }
    
    // Simple approach - just call the audio functions
    setIsAudioLoaded(false);
    
    if (isPlaying && !isPaused) {
      // Currently playing and not paused -> pause it
      console.log(`🎵 [AyahCard] Pausing audio for ${ayahKey}`);
      pauseAudio();
    } else if (isPlaying && isPaused) {
      // Currently playing but paused -> resume it
      console.log(`🎵 [AyahCard] Resuming audio for ${ayahKey}`);
      resumeAudio();
    } else {
      // Not playing -> play it
      console.log(`🎵 [AyahCard] Starting audio for ${ayahKey}`);
      playAudio(surahNumber, verse.verse_number);
    }
    
    // DEBUG: Track scroll position after audio action
    setTimeout(() => {
      const scrollAfter = window.scrollY;
      console.log(`🎵 [AyahCard] Final scroll position: ${scrollAfter} (diff: ${scrollAfter - scrollBefore})`);
    }, 600);
  };

  // Reset audio loaded state when playingAyah changes
  useEffect(() => {
    if (isPlaying) {
      setIsAudioLoaded(true);
    }
  }, [isPlaying]);

  const toggleTafseer = () => {
    setShowTafseer(!showTafseer);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`ayah-card bg-white rounded-xl p-6 shadow-md ${isPlaying ? 'playing' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="verse-number">
          {verse.verse_number}
        </div>
        
        <div className="flex space-x-2">
          {tafseerText && (
            <button
              type="button"
              onClick={toggleTafseer}
              className="flex items-center space-x-2 bg-islamic-600 hover:bg-islamic-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiBook} className="text-sm" />
              <span>{showTafseer ? 'Hide' : 'Show'} Tafseer</span>
            </button>
          )}
          
          <button
            type="button"
            onClick={handlePlayAudio}
            className={`flex items-center space-x-2 bg-islamic-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors audio-button ${isPlaying && !isPaused ? 'playing-animation' : ''}`}
            disabled={!isAudioLoaded && isPlaying}
          >
            <SafeIcon icon={isPlaying && !isPaused ? FiPause : FiPlay} className="text-sm" />
            <SafeIcon icon={FiVolume2} className="text-sm" />
            <span>{isPlaying && !isPaused ? 'Pause' : isPlaying && isPaused ? 'Resume' : 'Play'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="quran-text-pak text-islamic-800 text-right leading-loose">
          {verse.text_uthmani}
        </div>
        
        {verse.translations && verse.translations[0] && (
          <div className="english-text text-islamic-600 bg-islamic-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-islamic-500 mb-2">Translation:</p>
            <p>{verse.translations[0].text}</p>
          </div>
        )}
        
        {showTafseer && tafseerText && (
          <div className="bg-islamic-50 border-l-4 border-islamic-gold p-4 rounded-lg mt-3">
            <p className="text-sm font-medium text-islamic-500 mb-2">Tafseer:</p>
            <p className="text-islamic-700">{tafseerText}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(AyahCard, (prevProps, nextProps) => {
  // Only re-render if the verse data actually changed
  return (
    prevProps.verse.verse_key === nextProps.verse.verse_key &&
    prevProps.surahNumber === nextProps.surahNumber &&
    prevProps.index === nextProps.index
  );
});