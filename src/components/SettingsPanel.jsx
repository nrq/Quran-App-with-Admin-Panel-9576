import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';

const {
  FiX,
  FiPalette,
  FiGlobe,
  FiBookmark,
  FiArrowRight,
  FiHome,
  FiExternalLink
} = FiIcons;

const themeOptions = ['green', 'red', 'blue', 'light', 'dark', 'sepia'];
const languageOptions = ['English', 'Urdu', 'French', 'Norsk'];

const SettingsPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    theme,
    language,
    bookmarks,
    setThemePreference,
    setLanguagePreference
  } = useQuranData();

  const topBookmarks = useMemo(() => bookmarks.slice(0, 3), [bookmarks]);

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
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
                <p className="text-sm text-slate-500">Personalize your experience</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close settings"
              >
                <SafeIcon icon={FiX} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiPalette} className="text-islamic-gold" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Theme</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {themeOptions.map((option) => {
                    const isActive = theme === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setThemePreference(option)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
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
                  <SafeIcon icon={FiGlobe} className="text-islamic-gold" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Language</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {languageOptions.map((option) => {
                    const isActive = language === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setLanguagePreference(option)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
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
                  <SafeIcon icon={FiBookmark} className="text-islamic-gold" />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Bookmarks</h3>
                </div>
                {topBookmarks.length === 0 ? (
                  <p className="text-sm text-slate-500">No bookmarks yet. Tap a verse number to bookmark it.</p>
                ) : (
                  <div className="space-y-3">
                    {topBookmarks.map((bookmark) => (
                      <button
                        key={bookmark.id}
                        type="button"
                        onClick={() => handleNavigate(bookmark.surahNumber, bookmark.ayahNumber)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-islamic-50 border border-islamic-100 rounded-lg hover:border-islamic-gold transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-semibold text-islamic-700">
                            Surah {bookmark.surahNumber}: Ayah {bookmark.ayahNumber}
                          </p>
                          {bookmark.note && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {bookmark.note}
                            </p>
                          )}
                        </div>
                        <SafeIcon icon={FiArrowRight} className="text-islamic-gold" />
                      </button>
                    ))}
                    {bookmarks.length > 3 && (
                      <button
                        type="button"
                        onClick={handleViewAllBookmarks}
                        className="w-full px-4 py-2 text-sm font-medium text-islamic-gold hover:text-islamic-700 transition-colors"
                      >
                        View all bookmarks
                      </button>
                    )}
                  </div>
                )}
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
