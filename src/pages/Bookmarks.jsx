import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData, useQuranAudio } from '../contexts/QuranContext';

const {
  FiArrowLeft,
  FiBookmark,
  FiChevronRight,
  FiExternalLink,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiPlay,
  FiPause
} = FiIcons;

const Bookmarks = () => {
  const navigate = useNavigate();
  const { bookmarks, surahs, removeBookmark, updateBookmarkNote, fetchSurahVerses } = useQuranData();
  const { playAudio, pauseAudio, resumeAudio, playingAyah, isPaused } = useQuranAudio();
  const [editingId, setEditingId] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [versesCache, setVersionsCache] = useState({});

  const surahLookup = useMemo(() => {
    return surahs.reduce((accumulator, surah) => {
      accumulator[surah.id] = surah;
      return accumulator;
    }, {});
  }, [surahs]);

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    });
  }, [bookmarks]);

  // Load verses for bookmarks
  useEffect(() => {
    const loadVerses = async () => {
      const newCache = { ...versesCache };
      for (const bookmark of bookmarks) {
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

    if (bookmarks.length > 0) {
      loadVerses();
    }
  }, [bookmarks, fetchSurahVerses]);

  // Get first 5 words of Arabic text
  const getArabicPreview = (arabicText) => {
    if (!arabicText) return '';
    const words = arabicText.split(/\s+/).slice(0, 5);
    return words.join(' ');
  };

  // Get verse text for a bookmark
  const getVerseText = (surahNumber, ayahNumber) => {
    const verses = versesCache[`${surahNumber}`];
    if (!verses) return null;
    return verses.find((v) => v.verse_number === ayahNumber);
  };

  // Handle play audio
  const handlePlayAudio = (surahNumber, ayahNumber) => {
    const ayahKey = `${surahNumber}:${ayahNumber}`;
    if (playingAyah === ayahKey && !isPaused) {
      pauseAudio();
      return;
    }
    if (playingAyah === ayahKey && isPaused) {
      resumeAudio();
      return;
    }
    playAudio(surahNumber, ayahNumber);
  };

  const handleNavigateBack = () => {
    navigate('/');
  };

  const handleOpenBookmark = (bookmark) => {
    navigate(`/surah/${bookmark.surahNumber}?ayah=${bookmark.ayahNumber}`);
  };

  const handleEditNote = (bookmark) => {
    setEditingId(bookmark.id);
    setNoteValue(bookmark.note || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNoteValue('');
  };

  const handleSaveNote = (bookmarkId) => {
    const trimmedNote = noteValue.trim();
    updateBookmarkNote(bookmarkId, trimmedNote);
    setEditingId(null);
    setNoteValue('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-islamic-800">Bookmarks</h1>
          <p className="text-islamic-600">Manage and revisit your saved ayahs.</p>
        </div>
        <button
          type="button"
          onClick={handleNavigateBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-islamic-gold hover:text-islamic-gold transition-colors"
        >
          <SafeIcon icon={FiArrowLeft} />
          <span>Back to Home</span>
        </button>
      </div>

      {sortedBookmarks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center"
        >
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-islamic-50 flex items-center justify-center">
            <SafeIcon icon={FiBookmark} className="text-2xl text-islamic-gold" />
          </div>
          <h2 className="text-xl font-semibold text-islamic-700 mb-2">No bookmarks yet</h2>
          <p className="text-sm text-islamic-500 mb-4">
            Tap the verse number inside any surah to create your first bookmark.
          </p>
          <button
            type="button"
            onClick={handleNavigateBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-islamic-gold text-white hover:bg-yellow-600 transition-colors"
          >
            <SafeIcon icon={FiExternalLink} />
            <span>Explore Surahs</span>
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {sortedBookmarks.map((bookmark) => {
            const surah = surahLookup[bookmark.surahNumber];
            const isEditing = editingId === bookmark.id;
            const verseText = getVerseText(bookmark.surahNumber, bookmark.ayahNumber);
            const arabicPreview = verseText ? getArabicPreview(verseText.text_uthmani) : '';
            const ayahKey = `${bookmark.surahNumber}:${bookmark.ayahNumber}`;
            const isPlaying = playingAyah === ayahKey;

            return (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4">
                  {/* Header with Surah name and reference */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-islamic-800">
                        {surah ? surah.name_simple : `Surah ${bookmark.surahNumber}`}
                      </p>
                      <p className="text-sm text-islamic-500">
                        {bookmark.surahNumber}:{bookmark.ayahNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(bookmark.surahNumber, bookmark.ayahNumber)}
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                          isPlaying && !isPaused
                            ? 'bg-islamic-gold hover:bg-yellow-600 text-white'
                            : 'bg-islamic-100 text-islamic-700 hover:bg-islamic-200'
                        }`}
                        title={isPlaying ? (isPaused ? 'Resume audio' : 'Pause audio') : 'Play audio'}
                      >
                        <SafeIcon icon={isPlaying && !isPaused ? FiPause : FiPlay} className="text-lg" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBookmark(bookmark)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-islamic-gold text-white hover:bg-yellow-600 transition-colors"
                      >
                        <span>Open</span>
                        <SafeIcon icon={FiChevronRight} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditNote(bookmark)}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:border-islamic-gold hover:text-islamic-gold transition-colors"
                        title="Edit note"
                      >
                        <SafeIcon icon={FiEdit2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBookmark(bookmark.id)}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove bookmark"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  </div>

                  {/* Arabic preview */}
                  {arabicPreview && (
                    <div className="quran-text-pak text-right p-3 rounded-lg bg-islamic-50 border border-islamic-100 text-islamic-800 leading-relaxed">
                      {arabicPreview}
                    </div>
                  )}

                  {/* Note section */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={noteValue}
                        onChange={(event) => setNoteValue(event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 focus:border-islamic-gold focus:ring-2 focus:ring-islamic-gold/40 transition-colors p-3 text-sm"
                        placeholder="Add a personal reflection or reminder"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
                        >
                          <SafeIcon icon={FiX} />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNote(bookmark.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          <SafeIcon icon={FiCheck} />
                          <span>Save Note</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-islamic-50 border border-islamic-100 rounded-lg p-4">
                      <p className="text-xs uppercase tracking-wide text-islamic-500 mb-1">Note</p>
                      <p className="text-sm text-islamic-700">
                        {bookmark.note ? bookmark.note : 'No note added yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
