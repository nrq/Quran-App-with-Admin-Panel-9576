import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import AyahCard from '../components/AyahCard';
import AudioPlayer from '../components/AudioPlayer';
import { useQuranAudio, useQuranData } from '../contexts/QuranContext';

const { FiArrowLeft, FiBook, FiMapPin } = FiIcons;

const Surah = () => {
  const { surahNumber } = useParams();
  const location = useLocation();
  const { surahs, fetchSurahVerses, setCurrentSurah } = useQuranData();
  const { playingAyah } = useQuranAudio();
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [surah, setSurah] = useState(null);
  const lastScrolledAyahRef = useRef(null);
  const hasAppliedInitialScrollRef = useRef(false);

  const initialAyahFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const ayahParam = Number(params.get('ayah'));
    if (Number.isInteger(ayahParam) && ayahParam > 0) {
      return ayahParam;
    }
    return null;
  }, [location.search]);

  const scrollToAyah = useCallback((ayahNumber) => {
    const ayahElement = document.querySelector(`[data-ayah="${ayahNumber}"]`);
    if (ayahElement) {
      ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    lastScrolledAyahRef.current = null;
    hasAppliedInitialScrollRef.current = false;
  }, [surahNumber]);

  useEffect(() => {
    if (initialAyahFromQuery) {
      hasAppliedInitialScrollRef.current = false;
    }
  }, [initialAyahFromQuery]);

  useEffect(() => {
    if (!playingAyah) {
      return;
    }

    const [playingSurahId, playingAyahNumber] = playingAyah.split(':').map(Number);

    if (Number(surahNumber) !== playingSurahId || !playingAyahNumber) {
      return;
    }

    if (lastScrolledAyahRef.current === playingAyahNumber) {
      return;
    }

    lastScrolledAyahRef.current = playingAyahNumber;
    scrollToAyah(playingAyahNumber);
  }, [playingAyah, scrollToAyah, surahNumber]);

  useEffect(() => {
    if (!initialAyahFromQuery || loading || verses.length === 0 || hasAppliedInitialScrollRef.current) {
      return;
    }

    const ayahNumber = initialAyahFromQuery;
    const timer = setTimeout(() => {
      scrollToAyah(ayahNumber);
      lastScrolledAyahRef.current = ayahNumber;
      hasAppliedInitialScrollRef.current = true;
    }, 150);

    return () => clearTimeout(timer);
  }, [initialAyahFromQuery, loading, scrollToAyah, verses.length]);

  useEffect(() => {
    const loadSurah = async () => {
      setLoading(true);
  const surahInfo = surahs.find((item) => item.id === parseInt(surahNumber, 10)) || null;
      setSurah(surahInfo);
      setCurrentSurah(surahInfo);

      const versesData = surahInfo ? await fetchSurahVerses(surahNumber) : [];
      setVerses(versesData);
      setLoading(false);
    };

    if (surahs.length > 0) {
      loadSurah();
    }
  }, [fetchSurahVerses, setCurrentSurah, surahNumber, surahs]);

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
      {/* Separate Audio Player Component - Prevents Re-renders */}
      <AudioPlayer 
        verses={verses}
        surah={surah}
        surahNumber={surahNumber}
        onScrollToAyah={scrollToAyah}
      />

      {/* Add bottom padding for audio player */}
      <div className="pb-20">
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
          className="bismillah text-center py-1"
        >
          <div className="text-sm opacity-75">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </motion.div>
      )}

        <div className="space-y-6" id="verses-container">
          {verses.map((verse) => (
            <div key={`ayah-${surahNumber}-${verse.verse_number}`} data-ayah={verse.verse_number}>
              <AyahCard
                verse={verse}
                surahNumber={parseInt(surahNumber, 10)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Surah;