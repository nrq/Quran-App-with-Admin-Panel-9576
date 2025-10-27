import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranAudio, useQuranData } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiBook } = FiIcons;

const AyahCard = ({ verse, surahNumber }) => {
  const { playAudio, pauseAudio, resumeAudio, playingAyah, isPaused } = useQuranAudio();
  const { getTafseer, bookmarks, toggleBookmark, language } = useQuranData();
  const [showTafseer, setShowTafseer] = useState(false);

  const ayahKey = `${surahNumber}:${verse.verse_number}`;
  const isPlaying = playingAyah === ayahKey;
  const tafseerText = getTafseer(surahNumber, verse.verse_number);
  const isBookmarked = bookmarks.some(
    (bookmark) => bookmark.surahNumber === surahNumber && bookmark.ayahNumber === verse.verse_number
  );
  const translationMeta = verse.translations && verse.translations[0] ? verse.translations[0] : null;
  const translationLabel = translationMeta?.label || translationMeta?.language || language;

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
      className={`ayah-card bg-white rounded-xl p-6 shadow-md ${isPlaying ? 'playing' : ''}`}
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
        <div className="quran-text-pak text-islamic-800 text-right leading-loose">
          {verse.text_uthmani}
        </div>

        {translationMeta && (
          <div className="english-text text-islamic-600 bg-islamic-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-islamic-500 mb-2">
              Translation{translationLabel ? ` (${translationLabel})` : ''}:
            </p>
            <p>{translationMeta.text}</p>
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

export default memo(AyahCard, (prevProps, nextProps) => {
  return (
    prevProps.surahNumber === nextProps.surahNumber &&
    prevProps.verse.verse_key === nextProps.verse.verse_key
  );
});