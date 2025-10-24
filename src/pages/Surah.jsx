import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import AyahCard from '../components/AyahCard';
import { useQuran } from '../contexts/QuranContext';

const { FiArrowLeft, FiBook, FiMapPin, FiPlay, FiPause } = FiIcons;

const Surah = () => {
  const { surahNumber } = useParams();
  const { surahs, fetchSurahVerses, setCurrentSurah, playingAyah, isPaused, playAudio, pauseAudio, resumeAudio, stopAudio } = useQuran();
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [surah, setSurah] = useState(null);

  // DEBUG: Track component re-renders
  console.log(`🔄 [Surah] Component re-rendered - verses: ${verses.length}`);

  // Get currently playing verse details
  const getCurrentlyPlayingVerse = () => {
    if (!playingAyah || !verses.length) return null;
    
    const [playingSurah, playingAyahNumber] = playingAyah.split(':').map(Number);
    if (playingSurah !== parseInt(surahNumber)) return null;
    
    return verses.find(verse => verse.verse_number === playingAyahNumber);
  };

  const currentlyPlayingVerse = getCurrentlyPlayingVerse();

  // Audio control handlers
  const handlePlayPause = () => {
    if (!currentlyPlayingVerse) return;
    
    if (isPaused) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  };

  const handleStop = () => {
    stopAudio();
  };

  const handlePreviousAyah = () => {
    if (!currentlyPlayingVerse || currentlyPlayingVerse.verse_number <= 1) return;
    
    const prevAyahNumber = currentlyPlayingVerse.verse_number - 1;
    playAudio(parseInt(surahNumber), prevAyahNumber);
  };

  const handleNextAyah = () => {
    if (!currentlyPlayingVerse || !surah || currentlyPlayingVerse.verse_number >= surah.verses_count) return;
    
    const nextAyahNumber = currentlyPlayingVerse.verse_number + 1;
    playAudio(parseInt(surahNumber), nextAyahNumber);
  };

  // Scroll to specific ayah
  const scrollToAyah = (ayahNumber) => {
    const ayahElement = document.querySelector(`[data-ayah="${ayahNumber}"]`);
    if (ayahElement) {
      ayahElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  // DEBUG: Track page navigation/reload
  useEffect(() => {
    console.log(`📄 [Surah] Page loaded/reloaded for surah ${surahNumber}`);
    
    const handleBeforeUnload = (e) => {
      console.log(`📄 [Surah] Page about to unload/reload`);
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log(`📄 [Surah] Page hidden`);
      } else {
        console.log(`📄 [Surah] Page visible`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [surahNumber]);

  useEffect(() => {
    const loadSurah = async () => {
      setLoading(true);
      
      // Find surah info
      const surahInfo = surahs.find(s => s.id === parseInt(surahNumber));
      setSurah(surahInfo);
      setCurrentSurah(surahInfo);
      
      // Fetch verses
      const versesData = await fetchSurahVerses(surahNumber);
      setVerses(versesData);
      setLoading(false);
    };
    
    if (surahs.length > 0) {
      loadSurah();
    }
  }, [surahNumber, surahs, fetchSurahVerses, setCurrentSurah]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-islamic-600">Loading verses...</p>
        </div>
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="text-center py-12">
        <p className="text-islamic-600">Surah not found</p>
        <Link to="/" className="text-islamic-gold hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const showBismillah = surah.id !== 1 && surah.id !== 9;

  return (
    <div className="space-y-8">
      {/* Sticky Audio Player at Bottom */}
      {currentlyPlayingVerse && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-islamic-gold to-yellow-600 text-white shadow-lg border-t-2 border-yellow-700"
        >
          <div className="max-w-6xl mx-auto px-4 py-4">
            {/* Now Playing Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <SafeIcon 
                      icon={isPaused ? FiPlay : FiPause} 
                      className="text-sm animate-pulse" 
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      Now Playing
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollToAyah(currentlyPlayingVerse.verse_number)}
                      className="text-xs opacity-90 hover:opacity-100 hover:underline cursor-pointer"
                    >
                      {surah?.name_simple} - Ayah {currentlyPlayingVerse.verse_number} (Click to scroll)
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right flex-1 ml-4">
                <div className="quran-text-pak text-lg leading-relaxed">
                  {currentlyPlayingVerse.text_uthmani?.substring(0, 60)}
                  {currentlyPlayingVerse.text_uthmani?.length > 60 ? '...' : ''}
                </div>
                {currentlyPlayingVerse.translations?.[0] && (
                  <div className="mt-1 text-xs opacity-80 max-w-md ml-auto">
                    {currentlyPlayingVerse.translations[0].text.substring(0, 80)}
                    {currentlyPlayingVerse.translations[0].text.length > 80 ? '...' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={handlePreviousAyah}
                disabled={currentlyPlayingVerse.verse_number <= 1}
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiArrowLeft} className="text-lg" />
              </button>

              <button
                type="button"
                onClick={handlePlayPause}
                className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-40 transition-colors"
              >
                <SafeIcon 
                  icon={isPaused ? FiPlay : FiPause} 
                  className="text-xl" 
                />
              </button>

              <button
                type="button"
                onClick={handleStop}
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </button>

              <button
                type="button"
                onClick={handleNextAyah}
                disabled={!surah || currentlyPlayingVerse.verse_number >= surah.verses_count}
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiArrowLeft} className="text-lg rotate-180" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add bottom padding when sticky player is visible */}
      <div className={currentlyPlayingVerse ? 'pb-32' : ''}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-islamic-600 hover:text-islamic-800 mb-6 transition-colors"
        >
          <SafeIcon icon={FiArrowLeft} />
          <span>Back to Surahs</span>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-islamic-gold to-yellow-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{surah.id}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-islamic-800">{surah.name_simple}</h1>
              <p className="text-islamic-600 text-lg">{surah.translated_name.name}</p>
              <div className="flex items-center space-x-4 text-islamic-500 text-sm mt-2">
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={FiMapPin} className="text-xs" />
                  <span>{surah.revelation_place}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={FiBook} className="text-xs" />
                  <span>{surah.verses_count} verses</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="quran-text-pak text-4xl text-islamic-800">
              {surah.name_arabic}
            </div>
          </div>
        </div>
      </motion.div>

      {showBismillah && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bismillah text-center py-4"
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </motion.div>
      )}

        <div className="space-y-6" id="verses-container">
          {verses.map((verse, index) => (
            <div key={verse.verse_key} data-ayah={verse.verse_number}>
              <AyahCard 
                verse={verse} 
                surahNumber={parseInt(surahNumber)} 
                index={0} // Remove staggered animation to improve performance
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Surah;