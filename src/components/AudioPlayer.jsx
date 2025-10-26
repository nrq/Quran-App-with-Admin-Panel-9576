import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranAudio } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiArrowLeft, FiArrowUp } = FiIcons;

const AudioPlayer = ({ verses, surah, surahNumber, onScrollToAyah }) => {
  const { playingAyah, isPaused, playAudio, pauseAudio, resumeAudio } = useQuranAudio();

  const [isVisible, setIsVisible] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(null);

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

  const arabicPreview = useMemo(() => {
    if (!currentVerse?.text_uthmani) {
      return '';
    }

    const words = currentVerse.text_uthmani.split(' ').filter(Boolean);
    return words.slice(0, 3).join(' ');
  }, [currentVerse]);

  const surahReference = useMemo(() => {
    if (!surah || !currentVerse) {
      return '';
    }
    return `${surah.id}:${currentVerse.verse_number}`;
  }, [surah, currentVerse]);

  const playerContent = useMemo(() => {
    if (!currentVerse) return null;

    return (
      <div className="max-w-6xl mx-auto px-3 py-1">
        <div className="flex items-center space-x-3 mb-2">
          <button
            type="button"
            onClick={handleScrollToTop}
            className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            title="Scroll to top"
          >
            <SafeIcon icon={FiArrowUp} className="text-sm" />
          </button>
          <button
            type="button"
            onClick={handleScrollToAyah}
            className="flex-1 flex items-center justify-between text-left text-xs font-medium text-white/90 hover:text-white"
          >
            <span className="truncate pr-3">{surahReference}</span>
            <span className="quran-text-pak text-xs truncate">{arabicPreview}</span>
          </button>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <button
            type="button"
            onClick={handlePreviousAyah}
            disabled={currentVerse.verse_number <= 1}
            className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SafeIcon icon={FiArrowLeft} className="text-sm" />
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            className="w-9 h-9 bg-white bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-40 transition-colors"
          >
            <SafeIcon 
              icon={isPaused ? FiPlay : FiPause} 
              className="text-lg" 
            />
          </button>

          <button
            type="button"
            onClick={handleNextAyah}
            disabled={!surah || currentVerse.verse_number >= surah.verses_count}
            className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SafeIcon icon={FiArrowLeft} className="text-sm rotate-180" />
          </button>
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
      {playerContent}
    </motion.div>
  );
};

export default React.memo(AudioPlayer);