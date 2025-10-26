import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranAudio } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiArrowLeft, FiArrowUp } = FiIcons;

const AudioPlayer = ({ verses, surah, surahNumber, onScrollToAyah }) => {
  const { currentAudio, playingAyah, isPaused, playAudio, pauseAudio, resumeAudio } = useQuranAudio();

  const [isVisible, setIsVisible] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(null);
  const progressBarRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Memoize the current playing verse to prevent recalculation
  const getCurrentlyPlayingVerse = useCallback(() => {
    if (!playingAyah || !verses.length) return null;
    
    const [playingSurah, playingAyahNumber] = playingAyah.split(':').map(Number);
    if (playingSurah !== parseInt(surahNumber)) return null;
    
    return verses.find(verse => verse.verse_number === playingAyahNumber);
  }, [playingAyah, verses, surahNumber]);

  // Update local state only when necessary
  useEffect(() => {
    const verse = getCurrentlyPlayingVerse();

    if (verse) {
      setCurrentVerse(verse);
      setIsVisible(true);
      return;
    }

    if (!playingAyah) {
      setCurrentVerse(null);
      setIsVisible(false);
    }
  }, [getCurrentlyPlayingVerse, playingAyah]);

  const handlePlayPause = useCallback(() => {
    if (!currentVerse) return;
    
    if (isPaused) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  }, [currentVerse, isPaused, resumeAudio, pauseAudio]);

  const handlePreviousAyah = useCallback(() => {
    if (!currentVerse || currentVerse.verse_number <= 1) return;
    
    const prevAyahNumber = currentVerse.verse_number - 1;
    playAudio(parseInt(surahNumber), prevAyahNumber);
    if (onScrollToAyah) {
      onScrollToAyah(prevAyahNumber);
    }
  }, [currentVerse, surahNumber, playAudio, onScrollToAyah]);

  const handleNextAyah = useCallback(() => {
    if (!currentVerse || !surah || currentVerse.verse_number >= surah.verses_count) return;
    
    const nextAyahNumber = currentVerse.verse_number + 1;
    playAudio(parseInt(surahNumber), nextAyahNumber);
    if (onScrollToAyah) {
      onScrollToAyah(nextAyahNumber);
    }
  }, [currentVerse, surah, surahNumber, playAudio, onScrollToAyah]);

  const handleScrollToAyah = useCallback(() => {
    if (currentVerse && onScrollToAyah) {
      onScrollToAyah(currentVerse.verse_number);
    }
  }, [currentVerse, onScrollToAyah]);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const currentVerseNumber = currentVerse?.verse_number ?? null;

  useEffect(() => {
    if (!currentVerseNumber || !onScrollToAyah) {
      return;
    }

    onScrollToAyah(currentVerseNumber);
  }, [currentVerseNumber, onScrollToAyah]);

  const stripArabicDiacritics = useCallback((text) => {
    if (!text) {
      return '';
    }

    const diacriticsRegex = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;
    return text.replace(diacriticsRegex, '');
  }, []);

  const arabicPreview = useMemo(() => {
    if (!currentVerse?.text_uthmani) {
      return '';
    }

    const cleaned = stripArabicDiacritics(currentVerse.text_uthmani);
    const words = cleaned.split(/\s+/).filter(Boolean);
    return words.slice(0, 3).join(' ');
  }, [currentVerse, stripArabicDiacritics]);

  const surahReference = useMemo(() => {
    if (!surah || !currentVerse) {
      return '';
    }
    return `${surah.id}:${currentVerse.verse_number}`;
  }, [surah, currentVerse]);

  useEffect(() => {
    const bar = progressBarRef.current;

    if (!bar) {
      return () => {};
    }

    const resetBar = () => {
      bar.style.transform = 'scaleX(0)';
    };

    resetBar();

    if (!currentAudio) {
      return resetBar;
    }

    const updateProgress = () => {
      if (!currentAudio || !bar) {
        return;
      }

      const { currentTime, duration } = currentAudio;
      if (!duration || Number.isNaN(duration) || duration === 0) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
        return;
      }

      const progress = Math.min(Math.max(currentTime / duration, 0), 1);
      bar.style.transform = `scaleX(${progress})`;

      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    const stopTracking = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handlePlay = () => {
      stopTracking();
      updateProgress();
    };

    const handlePause = () => {
      stopTracking();
      updateProgress();
    };

    const handleEnded = () => {
      stopTracking();
      bar.style.transform = 'scaleX(1)';
      requestAnimationFrame(() => {
        resetBar();
      });
    };

    currentAudio.addEventListener('play', handlePlay);
    currentAudio.addEventListener('pause', handlePause);
    currentAudio.addEventListener('ended', handleEnded);

    if (!currentAudio.paused) {
      handlePlay();
    } else {
      handlePause();
    }

    return () => {
      stopTracking();
      resetBar();
      currentAudio.removeEventListener('play', handlePlay);
      currentAudio.removeEventListener('pause', handlePause);
      currentAudio.removeEventListener('ended', handleEnded);
    };
  }, [currentAudio]);

  const playerContent = useMemo(() => {
    if (!currentVerse) return null;

    return (
      <div className="max-w-6xl mx-auto px-3 py-1">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 md:gap-3 shrink-0 text-white/90">
            <button
              type="button"
              onClick={handleScrollToTop}
              className="w-7 h-7 md:w-8 md:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
              title="Scroll to top"
            >
              <SafeIcon icon={FiArrowUp} className="text-sm md:text-base" />
            </button>
            <button
              type="button"
              onClick={handleScrollToAyah}
              className="text-xs md:text-sm font-semibold hover:text-white"
            >
              {surahReference}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 md:gap-4 flex-1">
            <button
              type="button"
              onClick={handlePreviousAyah}
              disabled={currentVerse.verse_number <= 1}
              className="w-7 h-7 md:w-8 md:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiArrowLeft} className="text-sm md:text-base" />
            </button>

            <button
              type="button"
              onClick={handlePlayPause}
              className="w-9 h-9 md:w-10 md:h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-40 transition-colors"
            >
              <SafeIcon
                icon={isPaused ? FiPlay : FiPause}
                className="text-lg md:text-xl"
              />
            </button>

            <button
              type="button"
              onClick={handleNextAyah}
              disabled={!surah || currentVerse.verse_number >= surah.verses_count}
              className="w-7 h-7 md:w-8 md:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiArrowLeft} className="text-sm md:text-base rotate-180" />
            </button>
          </div>

          <span className="quran-text-pak text-xs md:text-lg truncate text-right min-w-0 overflow-hidden whitespace-nowrap">
            {arabicPreview}
          </span>
        </div>
      </div>
    );
  }, [arabicPreview, currentVerse, handleNextAyah, handlePlayPause, handlePreviousAyah, handleScrollToAyah, handleScrollToTop, isPaused, surahReference]);

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-islamic-gold to-yellow-600 text-white shadow-lg border-t-2 border-yellow-700"
    >
      <div className="relative">
        <div
          ref={progressBarRef}
          className="absolute left-0 right-0 top-0 h-1 origin-left scale-x-0 bg-emerald-400"
          style={{ transform: 'scaleX(0)' }}
        />
        {playerContent}
      </div>
    </motion.div>
  );
};

export default React.memo(AudioPlayer);