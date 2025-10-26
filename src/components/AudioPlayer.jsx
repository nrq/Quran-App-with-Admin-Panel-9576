import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranAudio } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiArrowLeft } = FiIcons;

const AudioPlayer = ({ verses, surah, surahNumber, onScrollToAyah }) => {
  const { playingAyah, isPaused, playAudio, pauseAudio, resumeAudio, stopAudio } = useQuranAudio();
  
  // Local state to prevent re-renders
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
    setCurrentVerse(verse);
    setIsVisible(!!verse);
  }, [getCurrentlyPlayingVerse]);

  // Memoize handlers to prevent re-creation
  const handlePlayPause = useCallback(() => {
    if (!currentVerse) return;
    
    if (isPaused) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  }, [currentVerse, isPaused, resumeAudio, pauseAudio]);

  const handleStop = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

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

  // Memoize the component content to prevent unnecessary re-renders
  const playerContent = useMemo(() => {
    if (!currentVerse) return null;

    return (
      <div className="max-w-6xl mx-auto px-3 py-1">
        {/* Compact Now Playing Info */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <SafeIcon 
                icon={isPaused ? FiPlay : FiPause} 
                className="text-xs animate-pulse" 
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleScrollToAyah}
                className="text-xs font-medium hover:underline cursor-pointer"
              >
                {surah?.name_simple} - Ayah {currentVerse.verse_number}
              </button>
            </div>
          </div>
          <div className="text-right flex-1 ml-3">
            <div className="quran-text-pak text-xs leading-relaxed">
              {arabicPreview}
            </div>
          </div>
        </div>

        {/* Compact Audio Controls */}
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
            onClick={handleStop}
            className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
          >
            <div className="w-2 h-2 bg-white rounded-sm"></div>
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
  }, [arabicPreview, currentVerse, isPaused, surah, handlePlayPause, handleStop, handlePreviousAyah, handleNextAyah, handleScrollToAyah]);

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