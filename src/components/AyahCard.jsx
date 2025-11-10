import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranAudio, useQuranData } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiBook } = FiIcons;

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

const THEME_ACCENT_BG_STYLES = {
  green: 'bg-emerald-50',
  red: 'bg-rose-50',
  blue: 'bg-blue-50',
  light: 'bg-slate-50',
  dark: 'bg-slate-700/50',
  sepia: 'bg-amber-100/50'
};

const THEME_PLAYING_STYLES = {
  green: 'border-emerald-500 bg-emerald-100/80 shadow-lg shadow-emerald-500/30',
  red: 'border-rose-500 bg-rose-100/80 shadow-lg shadow-rose-500/30',
  blue: 'border-blue-500 bg-blue-100/80 shadow-lg shadow-blue-500/30',
  light: 'border-yellow-500 bg-yellow-50/80 shadow-lg shadow-yellow-500/30',
  dark: 'border-blue-500 bg-blue-900/40 shadow-lg shadow-blue-500/50',
  sepia: 'border-orange-600 bg-orange-200/60 shadow-lg shadow-orange-600/40'
};

const AyahCard = ({ verse, surahNumber }) => {
  const { playAudio, pauseAudio, resumeAudio, playingAyah, isPaused } = useQuranAudio();
  const { getTafseer, bookmarks, toggleBookmark, language, theme } = useQuranData();
  const [showTafseer, setShowTafseer] = useState(false);

  const ayahKey = `${surahNumber}:${verse.verse_number}`;
  const isPlaying = playingAyah === ayahKey;
  const cardStyle = THEME_CARD_STYLES[theme] || THEME_CARD_STYLES.green;
  const textStyle = THEME_TEXT_STYLES[theme] || THEME_TEXT_STYLES.green;
  const secondaryTextStyle = THEME_SECONDARY_TEXT_STYLES[theme] || THEME_SECONDARY_TEXT_STYLES.green;
  const accentBgStyle = THEME_ACCENT_BG_STYLES[theme] || THEME_ACCENT_BG_STYLES.green;
  const playingStyle = THEME_PLAYING_STYLES[theme] || THEME_PLAYING_STYLES.green;
  const tafseerText = getTafseer(surahNumber, verse.verse_number);
  const isBookmarked = bookmarks.some(
    (bookmark) => bookmark.surahNumber === surahNumber && bookmark.ayahNumber === verse.verse_number
  );
  const translationMeta = verse.translations && verse.translations[0] ? verse.translations[0] : null;

  const handlePlayAudio = () => {
    if (isPlaying && !isPaused) {
      pauseAudio();
      return;
    }

    if (isPlaying && isPaused) {
      resumeAudio();
      return;
    }

    playAudio(surahNumber, verse.verse_number);
  };

  const handleToggleBookmark = () => {
    toggleBookmark(surahNumber, verse.verse_number);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`ayah-card rounded-xl p-6 shadow-md ${isPlaying ? playingStyle : cardStyle}`}
      data-ayah={verse.verse_number}
    >
      <div className="flex items-start justify-between mb-4">
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`verse-number ${isBookmarked ? 'bookmarked' : ''}`}
          aria-pressed={isBookmarked}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {verse.verse_number}
        </button>

        <div className="flex space-x-2">
          {tafseerText && (
            <button
              type="button"
              onClick={() => setShowTafseer((prev) => !prev)}
              className="flex items-center space-x-2 bg-islamic-600 hover:bg-islamic-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiBook} className="text-sm" />
              <span>{showTafseer ? 'Hide' : 'Show'} Tafseer</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePlayAudio}
            className={`flex items-center justify-center bg-islamic-gold hover:bg-yellow-600 text-white w-10 h-10 rounded-full transition-colors audio-button ${isPlaying && !isPaused ? 'playing-animation' : ''}`}
            aria-label={isPlaying ? (isPaused ? 'Resume audio' : 'Pause audio') : 'Play audio'}
          >
            <SafeIcon icon={isPlaying && !isPaused ? FiPause : FiPlay} className="text-base" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`quran-text-pak text-right leading-loose ${textStyle}`}>
          {verse.text_uthmani}
        </div>

        {translationMeta && (
          <div className={`english-text p-4 rounded-lg ${accentBgStyle}`}>
            <p className={textStyle}>{translationMeta.text}</p>
          </div>
        )}

        {showTafseer && tafseerText && (
          <div className={`border-l-4 border-islamic-gold p-4 rounded-lg mt-3 ${accentBgStyle}`}>
            <p className={`text-sm font-medium mb-2 ${secondaryTextStyle}`}>Tafseer:</p>
            <p className={textStyle}>{tafseerText}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(AyahCard, (prevProps, nextProps) => {
  return (
    prevProps.surahNumber === nextProps.surahNumber &&
    prevProps.verse.verse_key === nextProps.verse.verse_key
  );
});