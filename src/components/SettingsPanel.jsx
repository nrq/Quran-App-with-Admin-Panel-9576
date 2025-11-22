import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import { FaPalette } from 'react-icons/fa';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';

const {
  FiGlobe,
  FiBookmark,
  FiArrowRight,
  FiHome,
  FiExternalLink,
  FiVolume2,
  FiHeadphones,
  FiSearch
} = FiIcons;

const themeOptions = ['green', 'red', 'blue', 'light', 'dark', 'sepia'];
const languageOptions = ['English', 'Urdu', 'French', 'Norsk'];

const SettingsPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    theme,
    language,
    bookmarks,
    surahs,
    setThemePreference,
    setLanguagePreference,
    enablePrimaryAudio,
    enableSupplementalAudio,
    setPrimaryAudioEnabled,
    setSupplementalAudioEnabled,
    includeTranslationsInSearch,
    setSearchTranslationsEnabled,
    fetchSurahVerses
  } = useQuranData();

  const [versesCache, setVersionsCache] = useState({});

  const topBookmarks = useMemo(() => bookmarks.slice(0, 3), [bookmarks]);

  // Create surah lookup
  const surahLookup = useMemo(() => {
    return surahs.reduce((accumulator, surah) => {
      accumulator[surah.id] = surah;
      return accumulator;
    }, {});
  }, [surahs]);

  // Load verses for bookmarks
  useEffect(() => {
    const loadVerses = async () => {
      const newCache = { ...versesCache };
      for (const bookmark of topBookmarks) {
        const cacheKey = `${bookmark.surahNumber}`;
        if (!newCache[cacheKey]) {
          try {
            const verses = await fetchSurahVerses(bookmark.surahNumber);
            newCache[cacheKey] = verses;
          } catch (error) {
            console.error(`Error loading verses for surah ${bookmark.surahNumber}:`, error);
          }
        }
      }
      setVersionsCache(newCache);
    };

    if (topBookmarks.length > 0) {
      loadVerses();
    }
  }, [topBookmarks, fetchSurahVerses]);

  // Get verse text for a bookmark
  const getVerseText = (surahNumber, ayahNumber) => {
    const verses = versesCache[`${surahNumber}`];
    if (!verses) return null;
    return verses.find((v) => v.verse_number === ayahNumber);
  };

  const handleNavigate = (surahNumber, ayahNumber) => {
    onClose();
    navigate(`/surah/${surahNumber}?ayah=${ayahNumber}`);
  };

  const handleViewAllBookmarks = () => {
    onClose();
    navigate('/bookmarks');
  };

  const handleGoHome = () => {
    onClose();
    navigate('/');
  };

  const handleGoToAdmin = () => {
    onClose();
    navigate('/admin/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            id="settings-panel"
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiBookmark} className="text-islamic-gold" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Bookmarks</h3>
                </div>
                {topBookmarks.length === 0 ? (
                  <p className="text-sm text-slate-500">No bookmarks yet. Tap a verse number to bookmark it.</p>
                ) : (
                  <div className="space-y-3">
                    {topBookmarks.map((bookmark) => {
                      const surah = surahLookup[bookmark.surahNumber];
                      const verseText = getVerseText(bookmark.surahNumber, bookmark.ayahNumber);
                      const arabicText = verseText ? verseText.text_uthmani : '';

                      return (
                        <button
                          key={bookmark.id}
                          type="button"
                          onClick={() => handleNavigate(bookmark.surahNumber, bookmark.ayahNumber)}
                          className="w-full flex flex-col gap-2 px-4 py-3 bg-islamic-50 border border-islamic-100 rounded-lg hover:border-islamic-gold transition-colors"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="text-left">
                              <p className="text-sm font-semibold text-islamic-700">
                                {surah ? surah.name_simple : `Surah ${bookmark.surahNumber}`}:{bookmark.ayahNumber}
                              </p>
                            </div>
                            <SafeIcon icon={FiArrowRight} className="text-islamic-gold" />
                          </div>
                          {arabicText && (
                            <div className="quran-text-pak text-right text-sm text-islamic-800 truncate w-full">
                              {arabicText}
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {bookmarks.length > 3 && (
                      <button
                        type="button"
                        onClick={handleViewAllBookmarks}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg transition-all shadow-[0_14px_32px_-18px_rgba(34,197,94,0.45)] hover:bg-green-100 hover:text-green-700 hover:border-green-300 hover:shadow-[0_24px_48px_-18px_rgba(22,163,74,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                      >
                        <SafeIcon icon={FiBookmark} className="text-green-500" />
                        View all bookmarks
                      </button>
                    )}
                  </div>
                )}
              </section>

              <section>
                <div className="grid grid-cols-3 gap-3 mb-4 items-center">
                  <div className="flex items-center gap-2 col-span-2">
                    <SafeIcon icon={FaPalette} className="text-islamic-gold" />
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Theme</h3>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 justify-self-end"
                    aria-label="Close settings"
                  >
                    Close ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => {
                    const isActive = theme === option;
                    const baseClasses = 'px-2.5 py-2 rounded-md text-xs font-semibold capitalize text-white transition-transform transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

                    const optionColorClasses = {
                      green: 'bg-emerald-500 hover:bg-emerald-600 focus-visible:ring-emerald-400',
                      red: 'bg-rose-500 hover:bg-rose-600 focus-visible:ring-rose-400',
                      blue: 'bg-sky-500 hover:bg-sky-600 focus-visible:ring-sky-400',
                      light: 'bg-slate-300 text-slate-800 hover:bg-slate-400 focus-visible:ring-slate-300',
                      dark: 'bg-slate-800 hover:bg-slate-700 focus-visible:ring-slate-600',
                      sepia: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500'
                    };

                    const inactiveClasses = 'opacity-80';
                    const activeClasses = 'ring-2 ring-offset-2 ring-white shadow-lg';

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setThemePreference(option)}
                        className={`${baseClasses} ${optionColorClasses[option] || 'bg-slate-500 hover:bg-slate-600 focus-visible:ring-slate-400'} ${isActive ? activeClasses : inactiveClasses}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiGlobe} className="text-islamic-gold" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Language</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {languageOptions.map((option) => {
                    const isActive = language === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setLanguagePreference(option)}
                        className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          isActive
                            ? 'border-islamic-gold bg-islamic-50 text-islamic-gold'
                            : 'border-slate-200 text-slate-600 hover:border-islamic-gold/60'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiSearch} className="text-islamic-gold" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Search</h3>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeTranslationsInSearch}
                  onClick={() => setSearchTranslationsEnabled(!includeTranslationsInSearch)}
                  className={`w-full flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                    includeTranslationsInSearch
                      ? 'border-islamic-gold bg-islamic-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-700">Include translations in search</p>
                    <p className="text-xs text-slate-500">
                      Find matches in the selected translation along with Arabic text.
                    </p>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      includeTranslationsInSearch ? 'bg-islamic-gold' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        includeTranslationsInSearch ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiVolume2} className="text-islamic-gold" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Audio Options</h3>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enablePrimaryAudio}
                    onClick={() => setPrimaryAudioEnabled(!enablePrimaryAudio)}
                    className={`w-full flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                      enablePrimaryAudio
                        ? 'border-islamic-gold bg-islamic-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-islamic-gold/10">
                        <SafeIcon icon={FiHeadphones} className="text-lg text-islamic-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Afasy Recitation</p>
                        <p className="text-xs text-slate-500">Toggle the primary Alafasy recitation audio.</p>
                      </div>
                    </div>
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enablePrimaryAudio ? 'bg-islamic-gold' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          enablePrimaryAudio ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </span>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enableSupplementalAudio}
                    onClick={() => setSupplementalAudioEnabled(!enableSupplementalAudio)}
                    className={`w-full flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                      enableSupplementalAudio
                        ? 'border-islamic-gold bg-islamic-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-islamic-gold/10">
                        <SafeIcon icon={FiVolume2} className="text-lg text-islamic-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Custom Translation Audio</p>
                        <p className="text-xs text-slate-500">Toggle the supplemental translation playback.</p>
                      </div>
                    </div>
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enableSupplementalAudio ? 'bg-islamic-gold' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          enableSupplementalAudio ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 space-y-3">
              <button
                type="button"
                onClick={handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-islamic-gold hover:text-islamic-gold transition-colors"
              >
                <SafeIcon icon={FiHome} />
                <span>Go Home</span>
              </button>
              <button
                type="button"
                onClick={handleGoToAdmin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-islamic-gold text-white hover:bg-yellow-600 transition-colors"
              >
                <SafeIcon icon={FiExternalLink} />
                <span>URL</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
