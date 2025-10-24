import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuran } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiVolume2, FiBook } = FiIcons;

const AyahCard = ({ verse, surahNumber, index }) => {
  const { playAudio, pauseAudio, resumeAudio, playingAyah, isPaused, getTafseer } = useQuran();
  const [showTafseer, setShowTafseer] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(true);
  const scrollPositionRef = useRef(null);
  const ayahKey = `${surahNumber}:${verse.verse_number}`;
  const isPlaying = playingAyah === ayahKey;
  const tafseerText = getTafseer(surahNumber, verse.verse_number);

  const handlePlayAudio = (e) => {
    // CRITICAL: STOP ALL DEFAULT BEHAVIORS IMMEDIATELY
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    
    // Capture current scroll position BEFORE any state changes
    const currentScrollPosition = window.scrollY;
    scrollPositionRef.current = currentScrollPosition;
    
    // Remove focus from button to prevent focus-based scrolling
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
    
    // PREVENT ANY NAVIGATION OR RELOAD
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.href);
    }
    
    // Perform the audio action
    setIsAudioLoaded(false);
    if (isPlaying && !isPaused) {
      // Currently playing and not paused -> pause it
      pauseAudio();
    } else if (isPlaying && isPaused) {
      // Currently playing but paused -> resume it
      resumeAudio();
    } else {
      // Not playing -> play it
      playAudio(surahNumber, verse.verse_number);
    }
    
    // Restore scroll position aggressively to prevent any jumps
    const restoreScroll = () => {
      if (scrollPositionRef.current !== null) {
        window.scrollTo({
          top: scrollPositionRef.current,
          left: 0,
          behavior: 'instant'
        });
      }
    };
    
    // Multiple restoration attempts to catch any async scroll changes
    restoreScroll();
    requestAnimationFrame(restoreScroll);
    setTimeout(restoreScroll, 0);
    setTimeout(restoreScroll, 10);
    setTimeout(restoreScroll, 50);
    setTimeout(restoreScroll, 100);
    setTimeout(restoreScroll, 200);
    
    // Return false to prevent any default action
    return false;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`ayah-card bg-white rounded-xl p-6 shadow-md ${isPlaying ? 'playing' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
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
            onSubmit={(e) => { e.preventDefault(); return false; }}
            onMouseDown={(e) => { e.preventDefault(); }}
            className={`flex items-center space-x-2 bg-islamic-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors audio-button ${isPlaying && !isPaused ? 'playing-animation' : ''}`}
            disabled={!isAudioLoaded && isPlaying}
            style={{ cursor: 'pointer' }}
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

export default AyahCard;