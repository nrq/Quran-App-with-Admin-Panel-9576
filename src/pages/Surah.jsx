import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import AyahCard from '../components/AyahCard';
import AudioPlayer from '../components/AudioPlayer';
import RevelationPlaceIcon from '../components/RevelationPlaceIcon';
import { useQuranAudio, useQuranData } from '../contexts/QuranContext';

const { FiArrowLeft } = FiIcons;

const THEME_CARD_STYLES = {
  green: 'bg-emerald-50/50 border border-emerald-200',
  red: 'bg-rose-50/50 border border-rose-200',
  blue: 'bg-blue-50/50 border border-blue-200',
  light: 'bg-white border border-slate-200',
  dark: 'bg-slate-800/50 border border-slate-700',
  sepia: 'bg-amber-50/50 border border-amber-300'
};

const THEME_TEXT_STYLES = {
  green: 'text-emerald-950',
  red: 'text-rose-950',
  blue: 'text-blue-950',
  light: 'text-slate-900',
  dark: 'text-slate-50',
  sepia: 'text-amber-950'
};

const THEME_SECONDARY_TEXT_STYLES = {
  green: 'text-emerald-700',
  red: 'text-rose-700',
  blue: 'text-blue-700',
  light: 'text-slate-600',
  dark: 'text-slate-300',
  sepia: 'text-amber-800'
};

const THEME_LINK_STYLES = {
  green: 'text-emerald-600 hover:text-emerald-800',
  red: 'text-rose-600 hover:text-rose-800',
  blue: 'text-blue-600 hover:text-blue-800',
  light: 'text-slate-600 hover:text-slate-800',
  dark: 'text-slate-300 hover:text-slate-100',
  sepia: 'text-amber-700 hover:text-amber-900'
};

const Surah = () => {
  const { surahNumber } = useParams();
  const location = useLocation();
  const { surahs, fetchSurahVerses, setCurrentSurah, theme } = useQuranData();
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

  const cardStyle = THEME_CARD_STYLES[theme] || THEME_CARD_STYLES.green;
  const textStyle = THEME_TEXT_STYLES[theme] || THEME_TEXT_STYLES.green;
  const secondaryTextStyle = THEME_SECONDARY_TEXT_STYLES[theme] || THEME_SECONDARY_TEXT_STYLES.green;
  const linkStyle = THEME_LINK_STYLES[theme] || THEME_LINK_STYLES.green;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className={secondaryTextStyle}>Loading verses...</p>
        </div>
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="text-center py-12">
        <p className={secondaryTextStyle}>Surah not found</p>
        <Link to="/" className={`hover:underline mt-4 inline-block ${linkStyle}`}>
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
          className={`rounded-xl p-6 shadow-lg ${cardStyle}`}
        >
          <Link
            to="/"
            className={`inline-flex items-center space-x-2 mb-6 transition-colors ${linkStyle}`}
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
                <h1 className={`text-3xl font-bold ${textStyle}`}>{surah.name_simple}</h1>
                <p className={`text-lg ${textStyle}`}>{surah.translated_name.name}</p>
                <div className={`flex items-center space-x-4 text-sm mt-2 ${secondaryTextStyle}`}>
                  <div className="flex items-center">
                    <RevelationPlaceIcon place={surah.revelation_place} className="w-5 h-5" />
                  </div>
                  <span>•</span>
                  <span>{surah.verses_count} verses</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={`quran-text-pak text-4xl ${textStyle}`}>
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