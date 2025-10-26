import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';

const {
  FiArrowLeft,
  FiBookmark,
  FiChevronRight,
  FiExternalLink,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX
} = FiIcons;

const Bookmarks = () => {
  const navigate = useNavigate();
  const { bookmarks, surahs, removeBookmark, updateBookmarkNote } = useQuranData();
  const [editingId, setEditingId] = useState(null);
  const [noteValue, setNoteValue] = useState('');

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

            return (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-islamic-500 mb-1">Surah</p>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-islamic-100 text-sm font-semibold text-islamic-700">
                        {bookmark.surahNumber}
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-islamic-800">
                          {surah ? surah.name_simple : `Surah ${bookmark.surahNumber}`}
                        </p>
                        <p className="text-sm text-islamic-500">Ayah {bookmark.ayahNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-islamic-gold hover:text-islamic-gold transition-colors"
                    >
                      <SafeIcon icon={FiEdit2} />
                      <span>Edit Note</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBookmark(bookmark.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <SafeIcon icon={FiTrash2} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-3">
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
                  <div className="mt-4 bg-islamic-50 border border-islamic-100 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-islamic-500 mb-1">Note</p>
                    <p className="text-sm text-islamic-700">
                      {bookmark.note ? bookmark.note : 'No note added yet.'}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
