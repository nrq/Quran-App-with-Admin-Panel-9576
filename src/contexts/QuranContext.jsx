import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { handleFirebaseError, logFirebaseError } from '../utils/firebaseErrorHandler';

const SUPPORTED_THEMES = ['green', 'red', 'blue', 'light', 'dark', 'sepia'];
const DEFAULT_THEME = 'green';

const LANGUAGE_CONFIG = {
  English: {
    code: 'en',
    translationEdition: 'en.sahih',
    label: 'Saheeh International'
  },
  Urdu: {
    code: 'ur',
    translationEdition: 'ur.jalandhry',
    label: 'Fateh Muhammad Jalandhry'
  },
  French: {
    code: 'fr',
    translationEdition: 'fr.hamidullah',
    label: 'Muhammad Hamidullah'
  },
  Norsk: {
    code: 'no',
    translationEdition: 'no.berg',
    label: 'Einar Berg'
  }
};

const DEFAULT_LANGUAGE = 'English';

const AUDIO_PREFERENCES_STORAGE_KEY = 'quran_audio_preferences';

const buildTranslationStorageKey = (edition, surahNumber) => `quran_translation_${edition}_${surahNumber}`;

const QuranDataContext = createContext(null);
const QuranAudioContext = createContext(null);

export const useQuranData = () => {
  const context = useContext(QuranDataContext);
  if (!context) {
    throw new Error('useQuranData must be used within a QuranProvider');
  }
  return context;
};

export const useQuranAudio = () => {
  const context = useContext(QuranAudioContext);
  if (!context) {
    throw new Error('useQuranAudio must be used within a QuranProvider');
  }
  return context;
};

export const useQuran = () => {
  const data = useQuranData();
  const audio = useQuranAudio();
  return useMemo(() => ({ ...data, ...audio }), [data, audio]);
};

export const QuranProvider = ({ children }) => {
  const [surahs, setSurahs] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingAyah, setPlayingAyah] = useState(null);
  const [audioMappings, setAudioMappings] = useState({});
  const [tafseerMappings, setTafseerMappings] = useState({});
  const [customUrls, setCustomUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSurah, setCurrentSurah] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [lastPlayedPosition, setLastPlayedPosition] = useState(null);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [enablePrimaryAudio, setEnablePrimaryAudio] = useState(true);
  const [enableSupplementalAudio, setEnableSupplementalAudio] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const audioRef = useRef(null);
  const translationsCacheRef = useRef({});
  const translationWarningRef = useRef(new Set());
  const supplementalAudioPhaseRef = useRef('primary');
  const pendingSupplementalUrlRef = useRef(null);

  const persistAudioPreferences = useCallback((primaryEnabled, supplementalEnabled) => {
    try {
      localStorage.setItem(
        AUDIO_PREFERENCES_STORAGE_KEY,
        JSON.stringify({
          enablePrimaryAudio: Boolean(primaryEnabled),
          enableSupplementalAudio: Boolean(supplementalEnabled)
        })
      );
    } catch (error) {
      console.error('Failed to persist audio preferences:', error);
    }
  }, []);

  const persistReadingPosition = useCallback((surahNumber, ayahNumber) => {
    const position = {
      surahNumber,
      ayahNumber,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem('quran_reading_position', JSON.stringify(position));
    } catch (error) {
      console.error('Failed to persist reading position:', error);
    }

    setLastPlayedPosition(position);
  }, []);

  const getSupplementalAudioUrl = useCallback((surahNumber, ayahNumber) => {
    const normalizedSurah = Number(surahNumber);
    const normalizedAyah = Number(ayahNumber);

    if (
      !Number.isInteger(normalizedSurah) ||
      !Number.isInteger(normalizedAyah) ||
      normalizedSurah < 1 ||
      normalizedSurah > 114 ||
      normalizedAyah < 1
    ) {
      return null;
    }

    const paddedSurah = String(normalizedSurah).padStart(3, '0');
    const paddedAyah = String(normalizedAyah).padStart(3, '0');
    return `https://nrq.no/wp-content/uploads/ayah/${paddedSurah}/${paddedSurah}-${paddedAyah}.mp3`;
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('quran_theme');
      if (savedTheme && SUPPORTED_THEMES.includes(savedTheme)) {
        setTheme(savedTheme);
      }

      const savedLanguage = localStorage.getItem('quran_language');
      if (savedLanguage && LANGUAGE_CONFIG[savedLanguage]) {
        setLanguage(savedLanguage);
      }

      const savedBookmarks = localStorage.getItem('quran_bookmarks');
      if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks).map((bookmark) => ({
          id: bookmark.id || `${bookmark.surahNumber}:${bookmark.ayahNumber}`,
          surahNumber: Number(bookmark.surahNumber),
          ayahNumber: Number(bookmark.ayahNumber),
          note: bookmark.note || '',
          createdAt: bookmark.createdAt || Date.now()
        }));
        setBookmarks(parsed);
      }

      const savedAudioPrefs = localStorage.getItem(AUDIO_PREFERENCES_STORAGE_KEY);
      if (savedAudioPrefs) {
        try {
          const parsed = JSON.parse(savedAudioPrefs);
          if (typeof parsed.enablePrimaryAudio === 'boolean') {
            setEnablePrimaryAudio(parsed.enablePrimaryAudio);
          }
          if (typeof parsed.enableSupplementalAudio === 'boolean') {
            setEnableSupplementalAudio(parsed.enableSupplementalAudio);
          }
        } catch (preferencesError) {
          console.error('Failed to parse audio preferences:', preferencesError);
          localStorage.removeItem(AUDIO_PREFERENCES_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to restore preferences:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const themeClass = `theme-${theme}`;
    const { body } = document;
    const existingThemeClasses = Array.from(body.classList).filter((className) =>
      className.startsWith('theme-')
    );

    existingThemeClasses.forEach((className) => {
      if (className !== themeClass) {
        body.classList.remove(className);
      }
    });

    body.classList.add(themeClass);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const languageMeta = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG[DEFAULT_LANGUAGE];
    document.documentElement.setAttribute('lang', languageMeta.code);
  }, [language]);

  const fetchCustomUrls = useCallback(async () => {
    try {
      const customUrlsRef = collection(db, 'custom_urls');
      const querySnapshot = await getDocs(customUrlsRef);
      const urlsData = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      setCustomUrls(urlsData);
    } catch (error) {
      logFirebaseError('Fetch Custom URLs', error);
    }
  }, []);

  const setThemePreference = useCallback((value) => {
    const normalizedTheme = SUPPORTED_THEMES.includes(value) ? value : DEFAULT_THEME;

    try {
      localStorage.setItem('quran_theme', normalizedTheme);
    } catch (error) {
      console.error('Failed to persist theme preference:', error);
    }

    setTheme(normalizedTheme);
  }, []);

  const setLanguagePreference = useCallback((value) => {
    const normalizedLanguage = LANGUAGE_CONFIG[value] ? value : DEFAULT_LANGUAGE;

    try {
      localStorage.setItem('quran_language', normalizedLanguage);
    } catch (error) {
      console.error('Failed to persist language preference:', error);
    }

    translationWarningRef.current.delete(normalizedLanguage);
    setLanguage(normalizedLanguage);
  }, []);

  const setPrimaryAudioEnabled = useCallback(
    (value) => {
      const normalizedValue = Boolean(value);
      setEnablePrimaryAudio(normalizedValue);
      persistAudioPreferences(normalizedValue, enableSupplementalAudio);
    },
    [enableSupplementalAudio, persistAudioPreferences]
  );

  const setSupplementalAudioEnabled = useCallback(
    (value) => {
      const normalizedValue = Boolean(value);
      setEnableSupplementalAudio(normalizedValue);
      persistAudioPreferences(enablePrimaryAudio, normalizedValue);
    },
    [enablePrimaryAudio, persistAudioPreferences]
  );

  const toggleBookmark = useCallback((surahNumber, ayahNumber) => {
    if (!surahNumber || !ayahNumber) {
      return;
    }

    let actionResult = 'added';

    setBookmarks((prev) => {
      const existingIndex = prev.findIndex(
        (bookmark) => bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber
      );

      let nextBookmarks;
      if (existingIndex !== -1) {
        nextBookmarks = [...prev];
        nextBookmarks.splice(existingIndex, 1);
        actionResult = 'removed';
      } else {
        const newBookmark = {
          id: `${surahNumber}:${ayahNumber}`,
          surahNumber,
          ayahNumber,
          note: '',
          createdAt: Date.now()
        };
        nextBookmarks = [newBookmark, ...prev];
        actionResult = 'added';
      }

      try {
        localStorage.setItem('quran_bookmarks', JSON.stringify(nextBookmarks));
      } catch (error) {
        console.error('Failed to persist bookmarks:', error);
      }

      return nextBookmarks;
    });

    toast.success(actionResult === 'added' ? 'Bookmark added' : 'Bookmark removed');
  }, []);

  const removeBookmark = useCallback((bookmarkId) => {
    if (!bookmarkId) {
      return;
    }

    setBookmarks((prev) => {
      const nextBookmarks = prev.filter((bookmark) => bookmark.id !== bookmarkId);

      try {
        localStorage.setItem('quran_bookmarks', JSON.stringify(nextBookmarks));
      } catch (error) {
        console.error('Failed to persist bookmarks:', error);
      }

      return nextBookmarks;
    });

    toast.success('Bookmark removed');
  }, []);

  const updateBookmarkNote = useCallback((bookmarkId, note) => {
    setBookmarks((prev) => {
      const nextBookmarks = prev.map((bookmark) =>
        bookmark.id === bookmarkId
          ? {
              ...bookmark,
              note,
              updatedAt: Date.now()
            }
          : bookmark
      );

      try {
        localStorage.setItem('quran_bookmarks', JSON.stringify(nextBookmarks));
      } catch (error) {
        console.error('Failed to persist bookmarks:', error);
      }

      return nextBookmarks;
    });

    toast.success('Bookmark updated');
  }, []);

  const fetchTranslationForSurah = useCallback(async (languageKey, surahNumber) => {
    const resolveTranslation = async (languageKeyToUse, allowFallback) => {
      const languageMeta = LANGUAGE_CONFIG[languageKeyToUse] || LANGUAGE_CONFIG[DEFAULT_LANGUAGE];
      const edition = languageMeta.translationEdition;
      const cacheKey = `${edition}:${surahNumber}`;

      if (translationsCacheRef.current[cacheKey]) {
        return translationsCacheRef.current[cacheKey];
      }

      const storageKey = buildTranslationStorageKey(edition, surahNumber);

      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          translationsCacheRef.current[cacheKey] = parsed;
          return parsed;
        }
      } catch (error) {
        console.error('Failed to restore cached translation:', error);
      }

      try {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition}`);
        if (!response.ok) {
          throw new Error(`Translation request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const ayahs = payload?.data?.ayahs;
        if (!Array.isArray(ayahs) || ayahs.length === 0) {
          throw new Error('Translation payload missing ayahs');
        }

        const translationName = payload?.data?.edition?.name || languageMeta.label;
        const entries = ayahs.reduce((acc, ayah) => {
          acc[ayah.numberInSurah] = ayah.text;
          return acc;
        }, {});

        const normalized = {
          edition,
          languageKey: languageKeyToUse,
          name: translationName,
          entries
        };

        translationsCacheRef.current[cacheKey] = normalized;

        try {
          localStorage.setItem(storageKey, JSON.stringify(normalized));
        } catch (storageError) {
          console.error('Failed to persist translation cache:', storageError);
        }

        return normalized;
      } catch (error) {
        console.error(`Failed to fetch translation for ${languageKeyToUse}`, error);

        if (!translationWarningRef.current.has(languageKeyToUse)) {
          translationWarningRef.current.add(languageKeyToUse);

          if (languageKeyToUse !== DEFAULT_LANGUAGE) {
            toast.error(`Unable to load ${languageKeyToUse} translation. Falling back to English.`);
          } else {
            toast.error('Unable to load English translation at the moment.');
          }
        }

        if (allowFallback && languageKeyToUse !== DEFAULT_LANGUAGE) {
          return resolveTranslation(DEFAULT_LANGUAGE, false);
        }

        return null;
      }
    };

    return resolveTranslation(languageKey, true);
  }, []);

  const fetchUpdatedAudioMapping = useCallback(async (surahNumber, ayahNumber) => {
    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(
        audioMappingsRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const data = querySnapshot.docs[0].data();

      let customUrl = null;
      if (data.custom_url_id) {
        const customUrlsRef = collection(db, 'custom_urls');
        const urlsSnapshot = await getDocs(customUrlsRef);
        const match = urlsSnapshot.docs
          .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
          .find((url) => url.id === data.custom_url_id);
        customUrl = match ? match.url : null;
      }

      const key = `${surahNumber}:${ayahNumber}`;
      setAudioMappings((prev) => ({
        ...prev,
        [key]: {
          url: data.audio_url,
          customUrlId: data.custom_url_id,
          customUrl
        }
      }));
    } catch (error) {
      logFirebaseError('Fetch Updated Audio Mapping', error);
    }
  }, []);

  const updateAudioMappingsWithUrl = useCallback(async (urlId) => {
    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(audioMappingsRef, where('custom_url_id', '==', urlId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const customUrlsRef = collection(db, 'custom_urls');
      const urlsSnapshot = await getDocs(customUrlsRef);
      const matchedUrl = urlsSnapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
        .find((url) => url.id === urlId);

      setAudioMappings((prev) => {
        const next = { ...prev };
        querySnapshot.docs.forEach((docSnapshot) => {
          const mapping = docSnapshot.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          next[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl: matchedUrl ? matchedUrl.url : null
          };
        });
        localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
        return next;
      });
    } catch (error) {
      logFirebaseError('Update Audio Mappings with URL', error);
    }
  }, []);

  const createCustomUrl = useCallback(
    async (url, title = '', description = '') => {
      try {
        const customUrlsRef = collection(db, 'custom_urls');
        const docRef = await addDoc(customUrlsRef, {
          url,
          title,
          description,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        await fetchCustomUrls();
        toast.success('Custom URL created successfully');
        return docRef.id;
      } catch (error) {
        logFirebaseError('Create Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return null;
      }
    },
    [fetchCustomUrls]
  );

  const updateCustomUrl = useCallback(
    async (urlId, updates) => {
      try {
        const docRef = doc(db, 'custom_urls', urlId);
        await updateDoc(docRef, {
          ...updates,
          updated_at: serverTimestamp()
        });

        await fetchCustomUrls();
        toast.success('Custom URL updated successfully');
        return true;
      } catch (error) {
        logFirebaseError('Update Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchCustomUrls]
  );

  const deleteCustomUrl = useCallback(
    async (urlId) => {
      try {
        const audioMappingsRef = collection(db, 'audio_mappings');
        const q = query(audioMappingsRef, where('custom_url_id', '==', urlId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          toast.error('Cannot delete URL: it is being used by audio mappings');
          return false;
        }

        const docRef = doc(db, 'custom_urls', urlId);
        await deleteDoc(docRef);
        await fetchCustomUrls();

        toast.success('Custom URL deleted successfully');
        return true;
      } catch (error) {
        logFirebaseError('Delete Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchCustomUrls]
  );

  const saveCustomUrl = useCallback(
    async (url, title = '', description = '') => {
      try {
        const customUrlsRef = collection(db, 'custom_urls');
        const q = query(customUrlsRef, where('url', '==', url));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          await updateCustomUrl(existingDoc.id, { title, description });
          return existingDoc.id;
        }

        return await createCustomUrl(url, title, description);
      } catch (error) {
        logFirebaseError('Save Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return null;
      }
    },
    [createCustomUrl, updateCustomUrl]
  );

  const getCustomUrlById = useCallback(
    (urlId) => customUrls.find((url) => url.id === urlId) || null,
    [customUrls]
  );

  const saveAudioMapping = useCallback(
    async (surahNumber, ayahNumber, audioUrl, customUrlTitle = '') => {
      const key = `${surahNumber}:${ayahNumber}`;

      try {
        let customUrlId = null;
        if (audioUrl) {
          customUrlId = await saveCustomUrl(
            audioUrl,
            customUrlTitle || `Audio for ${surahNumber}:${ayahNumber}`
          );
        }

        const audioMappingsRef = collection(db, 'audio_mappings');
        const q = query(
          audioMappingsRef,
          where('surah_number', '==', surahNumber),
          where('ayah_number', '==', ayahNumber)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          const docRef = doc(db, 'audio_mappings', existingDoc.id);
          await updateDoc(docRef, {
            audio_url: audioUrl,
            custom_url_id: customUrlId,
            updated_at: serverTimestamp()
          });
        } else {
          await addDoc(audioMappingsRef, {
            surah_number: surahNumber,
            ayah_number: ayahNumber,
            audio_url: audioUrl,
            custom_url_id: customUrlId,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }

        setAudioMappings((prev) => {
          const next = {
            ...prev,
            [key]: {
              url: audioUrl,
              customUrlId,
              customUrl: audioUrl
            }
          };
          localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
          return next;
        });

        toast.success('Audio mapping saved successfully');
        return true;
      } catch (error) {
        logFirebaseError('Save Audio Mapping', error);
        const errorMessage = handleFirebaseError(error);

        setAudioMappings((prev) => {
          const next = {
            ...prev,
            [key]: {
              url: audioUrl,
              customUrl: audioUrl
            }
          };
          localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
          return next;
        });

        toast.error(`${errorMessage} - Saved locally instead.`);
        return false;
      }
    },
    [saveCustomUrl]
  );

  const deleteAudioMapping = useCallback(async (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;

    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(
        audioMappingsRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      const docRef = doc(db, 'audio_mappings', querySnapshot.docs[0].id);
      await deleteDoc(docRef);

      setAudioMappings((prev) => {
        const next = { ...prev };
        delete next[key];
        localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
        return next;
      });

      toast.success('Audio mapping deleted successfully');
      return true;
    } catch (error) {
      logFirebaseError('Delete Audio Mapping', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const saveTafseerMapping = useCallback(async (surahNumber, ayahNumber, tafseerText) => {
    const key = `${surahNumber}:${ayahNumber}`;

    try {
      const tafseerEntriesRef = collection(db, 'tafseer_entries');
      const q = query(
        tafseerEntriesRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const docRef = doc(db, 'tafseer_entries', existingDoc.id);
        await updateDoc(docRef, {
          tafseer_text: tafseerText,
          updated_at: serverTimestamp()
        });
      } else {
        await addDoc(tafseerEntriesRef, {
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          tafseer_text: tafseerText,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }

      setTafseerMappings((prev) => {
        const next = { ...prev, [key]: tafseerText };
        localStorage.setItem('quran_tafseer_mappings', JSON.stringify(next));
        return next;
      });

      toast.success('Tafseer saved successfully');
    } catch (error) {
      logFirebaseError('Save Tafseer', error);
      const errorMessage = handleFirebaseError(error);

      setTafseerMappings((prev) => {
        const next = { ...prev, [key]: tafseerText };
        localStorage.setItem('quran_tafseer_mappings', JSON.stringify(next));
        return next;
      });

      toast.error(`${errorMessage} - Saved locally instead.`);
    }
  }, []);

  const deleteTafseerMapping = useCallback(async (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;

    try {
      const tafseerEntriesRef = collection(db, 'tafseer_entries');
      const q = query(
        tafseerEntriesRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      const docRef = doc(db, 'tafseer_entries', querySnapshot.docs[0].id);
      await deleteDoc(docRef);

      setTafseerMappings((prev) => {
        const next = { ...prev };
        delete next[key];
        localStorage.setItem('quran_tafseer_mappings', JSON.stringify(next));
        return next;
      });

      toast.success('Tafseer deleted successfully');
      return true;
    } catch (error) {
      logFirebaseError('Delete Tafseer', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const getAudioUrl = useCallback((surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    const mapping = audioMappings[key];

    if (mapping?.customUrl) {
      return mapping.customUrl;
    }

    if (mapping?.url) {
      return mapping.url;
    }

    return `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`;
  }, [audioMappings]);

  const getTafseer = useCallback((surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    return tafseerMappings[key] || '';
  }, [tafseerMappings]);

  const pauseAudio = useCallback(() => {
    if (!audioRef.current || audioRef.current.paused) {
      return;
    }
    audioRef.current.pause();
  }, []);

  const resumeAudio = useCallback(() => {
    if (!audioRef.current || !audioRef.current.paused) {
      return;
    }
    const playPromise = audioRef.current.play();
    if (playPromise) {
      playPromise.catch((error) => {
        console.error('Audio resume error:', error);
        toast.error('Unable to resume audio playback.');
      });
    }
  }, []);

  const destroyCurrentAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audioRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    destroyCurrentAudio();
    setCurrentAudio(null);
    setPlayingAyah(null);
    setIsPaused(false);
  }, [destroyCurrentAudio]);

  const playAudio = useCallback(
    (surahNumber, ayahNumber, autoPlayNext = true) => {
      const ayahKey = `${surahNumber}:${ayahNumber}`;
      const shouldPlayPrimary = enablePrimaryAudio;
      const supplementalUrl = enableSupplementalAudio
        ? getSupplementalAudioUrl(surahNumber, ayahNumber)
        : null;

      if (!shouldPlayPrimary && !supplementalUrl) {
        toast.error('Audio playback is disabled in settings.');
        return;
      }

      if (audioRef.current && playingAyah === ayahKey) {
        if (audioRef.current.paused) {
          resumeAudio();
        } else {
          pauseAudio();
        }
        return;
      }

      destroyCurrentAudio();

      setPlayingAyah(ayahKey);
      setIsPaused(false);
      persistReadingPosition(surahNumber, ayahNumber);
      supplementalAudioPhaseRef.current = 'primary';
      pendingSupplementalUrlRef.current = supplementalUrl;

      const advanceToNextOrStop = () => {
        const currentSurahData = surahs.find((surah) => surah.id === surahNumber);
        const shouldAutoAdvance =
          autoPlayNext && currentSurahData && ayahNumber < currentSurahData.verses_count;

        if (shouldAutoAdvance) {
          destroyCurrentAudio();
          playAudio(surahNumber, ayahNumber + 1, true);
          return;
        }

        setPlayingAyah(null);
        setCurrentAudio(null);
        setIsPaused(false);
        destroyCurrentAudio();
      };

      const playSupplementalAudio = (directPlayback = false) => {
        const supplementalAudioUrl = pendingSupplementalUrlRef.current;
        if (!supplementalAudioUrl) {
          advanceToNextOrStop();
          return;
        }

        const supplementalToastId = toast.loading(directPlayback ? 'Loading audio...' : 'Loading translation audio...');
        const supplementalAudio = new Audio(supplementalAudioUrl);
        supplementalAudio.preload = 'auto';
        supplementalAudio.crossOrigin = 'anonymous';

        supplementalAudioPhaseRef.current = 'supplemental';

        const cleanupSupplementalListeners = () => {
          supplementalAudio.removeEventListener('playing', handleSupplementalPlaying);
          supplementalAudio.removeEventListener('pause', handleSupplementalPause);
          supplementalAudio.removeEventListener('ended', handleSupplementalEnded);
          supplementalAudio.removeEventListener('error', handleSupplementalError);
          supplementalAudio.removeEventListener('stalled', handleSupplementalError);
        };

        const handleSupplementalPlaying = () => {
          toast.dismiss(supplementalToastId);
          setIsPaused(false);
        };

        const handleSupplementalPause = () => {
          if (supplementalAudio.paused) {
            setIsPaused(true);
          }
        };

        const handleSupplementalError = (event) => {
          console.error('Supplemental audio playback error:', event);
          toast.dismiss(supplementalToastId);
          cleanupSupplementalListeners();
          destroyCurrentAudio();
          supplementalAudioPhaseRef.current = 'primary';
          pendingSupplementalUrlRef.current = null;
          setCurrentAudio(null);
          setIsPaused(false);
          advanceToNextOrStop();
        };

        const handleSupplementalEnded = () => {
          cleanupSupplementalListeners();
          pendingSupplementalUrlRef.current = null;
          supplementalAudioPhaseRef.current = 'primary';
          destroyCurrentAudio();
          advanceToNextOrStop();
        };

        supplementalAudio.addEventListener('playing', handleSupplementalPlaying);
        supplementalAudio.addEventListener('pause', handleSupplementalPause);
        supplementalAudio.addEventListener('ended', handleSupplementalEnded);
        supplementalAudio.addEventListener('error', handleSupplementalError);
        supplementalAudio.addEventListener('stalled', handleSupplementalError);

        audioRef.current = supplementalAudio;
        setCurrentAudio(supplementalAudio);

        const supplementalPlayPromise = supplementalAudio.play();
        if (supplementalPlayPromise) {
          supplementalPlayPromise.catch((error) => {
            console.error('Supplemental audio play promise rejected:', error);
            toast.dismiss(supplementalToastId);
            cleanupSupplementalListeners();
            destroyCurrentAudio();
            supplementalAudioPhaseRef.current = 'primary';
            pendingSupplementalUrlRef.current = null;
            setCurrentAudio(null);
            setIsPaused(false);
            advanceToNextOrStop();
          });
        }
      };

      if (!shouldPlayPrimary) {
        playSupplementalAudio(true);
        return;
      }

      const audioUrl = getAudioUrl(surahNumber, ayahNumber);
      const loadingToastId = toast.loading('Loading audio...');
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';

      const cleanupAudioListeners = () => {
        audio.removeEventListener('playing', handlePlaying);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('stalled', handleError);
      };

      const handlePlaying = () => {
        toast.dismiss(loadingToastId);
        setIsPaused(false);
      };

      const handlePause = () => {
        if (audio.paused) {
          setIsPaused(true);
        }
      };

      const handleError = (event) => {
        console.error('Audio playback error:', event);
        toast.dismiss(loadingToastId);
        cleanupAudioListeners();
        setIsPaused(false);
        setCurrentAudio(null);
        destroyCurrentAudio();
        pendingSupplementalUrlRef.current = null;
        advanceToNextOrStop();
      };

      const handleEnded = () => {
        cleanupAudioListeners();
        destroyCurrentAudio();

        if (pendingSupplementalUrlRef.current && supplementalUrl) {
          playSupplementalAudio();
          return;
        }

        advanceToNextOrStop();
      };

      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('stalled', handleError);

      audioRef.current = audio;
      setCurrentAudio(audio);

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          console.error('Audio play promise rejected:', error);
          toast.dismiss(loadingToastId);
          cleanupAudioListeners();
          setIsPaused(false);
          setCurrentAudio(null);
          destroyCurrentAudio();
          pendingSupplementalUrlRef.current = null;
          advanceToNextOrStop();
        });
      }
    },
    [
      destroyCurrentAudio,
      enablePrimaryAudio,
      enableSupplementalAudio,
      getAudioUrl,
      getSupplementalAudioUrl,
      pauseAudio,
      persistReadingPosition,
      playingAyah,
      resumeAudio,
      surahs
    ]
  );

  const fetchSurahVerses = useCallback(async (surahNumber) => {
    try {
      const { getSurahVerses } = await import('../data/quran-data.js');
      const baseVerses = await getSurahVerses(surahNumber);
      const normalizedVerses = Array.isArray(baseVerses)
        ? baseVerses.map((verse) => ({
            ...verse,
            translations: Array.isArray(verse.translations) ? [...verse.translations] : []
          }))
        : [];

      if (normalizedVerses.length === 0) {
        return normalizedVerses;
      }

      const translation = await fetchTranslationForSurah(language, Number(surahNumber));

      if (!translation) {
        return normalizedVerses;
      }

      return normalizedVerses.map((verse) => {
        const translationText =
          translation.entries?.[verse.verse_number] ?? translation.entries?.[String(verse.verse_number)];

        if (!translationText) {
          return {
            ...verse,
            translations: []
          };
        }

        return {
          ...verse,
          translations: [
            {
              text: translationText,
              language: translation.languageKey,
              label: translation.name,
              edition: translation.edition
            }
          ]
        };
      });
    } catch (error) {
      console.error('Error loading offline verses:', error);
      toast.error('Failed to load verses');
      return [];
    }
  }, [fetchTranslationForSurah, language]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    const inPrimaryPhase = supplementalAudioPhaseRef.current === 'primary';
    const inSupplementalPhase = supplementalAudioPhaseRef.current === 'supplemental';

    if ((!enablePrimaryAudio && inPrimaryPhase) || (!enableSupplementalAudio && inSupplementalPhase)) {
      stopAudio();
    }
  }, [enablePrimaryAudio, enableSupplementalAudio, stopAudio]);

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const { getAllSurahsInfo } = await import('../data/quran-data.js');
        const surahsData = getAllSurahsInfo();
        setSurahs(surahsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading offline surahs:', error);
        toast.error('Failed to load Quran chapters');
        setLoading(false);
      }
    };

    loadSurahs();
  }, []);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const customUrlsRef = collection(db, 'custom_urls');
        const urlsSnapshot = await getDocs(customUrlsRef);
        const urlsData = urlsSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data()
        }));
        setCustomUrls(urlsData);

        const audioMappingsRef = collection(db, 'audio_mappings');
        const audioSnapshot = await getDocs(audioMappingsRef);
        const audioMap = {};
        for (const docSnapshot of audioSnapshot.docs) {
          const mapping = docSnapshot.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;

          let customUrl = null;
          if (mapping.custom_url_id) {
            const relatedUrl = urlsData.find((url) => url.id === mapping.custom_url_id);
            customUrl = relatedUrl ? relatedUrl.url : null;
          }

          audioMap[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl
          };
        }
        setAudioMappings(audioMap);

        const tafseerEntriesRef = collection(db, 'tafseer_entries');
        const tafseerSnapshot = await getDocs(tafseerEntriesRef);
        const tafseerMap = {};
        tafseerSnapshot.docs.forEach((docSnapshot) => {
          const mapping = docSnapshot.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          tafseerMap[key] = mapping.tafseer_text;
        });
        setTafseerMappings(tafseerMap);
      } catch (error) {
        if (error.code !== 'permission-denied') {
          logFirebaseError('Fetch Mappings', error);
          const errorMessage = handleFirebaseError(error);
          toast.error(errorMessage);
        }

        const savedAudioMappings = localStorage.getItem('quran_audio_mappings');
        if (savedAudioMappings) {
          setAudioMappings(JSON.parse(savedAudioMappings));
        }

        const savedTafseerMappings = localStorage.getItem('quran_tafseer_mappings');
        if (savedTafseerMappings) {
          setTafseerMappings(JSON.parse(savedTafseerMappings));
        }
      }
    };

    fetchMappings();
  }, []);

  useEffect(() => {
    const audioMappingsRef = collection(db, 'audio_mappings');
    const unsubscribeAudio = onSnapshot(
      audioMappingsRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            fetchUpdatedAudioMapping(data.surah_number, data.ayah_number);
          }
        });
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          logFirebaseError('Audio Mappings Listener', error);
        }
      }
    );

    const tafseerEntriesRef = collection(db, 'tafseer_entries');
    const unsubscribeTafseer = onSnapshot(
      tafseerEntriesRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const key = `${data.surah_number}:${data.ayah_number}`;
            setTafseerMappings((prev) => ({ ...prev, [key]: data.tafseer_text }));
          }
        });
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          logFirebaseError('Tafseer Entries Listener', error);
        }
      }
    );

    const customUrlsRef = collection(db, 'custom_urls');
    const unsubscribeUrls = onSnapshot(
      customUrlsRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            fetchCustomUrls();
            updateAudioMappingsWithUrl(change.doc.id);
          }
        });
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          logFirebaseError('Custom URLs Listener', error);
        }
      }
    );

    return () => {
      unsubscribeAudio();
      unsubscribeTafseer();
      unsubscribeUrls();
    };
  }, [fetchCustomUrls, fetchUpdatedAudioMapping, updateAudioMappingsWithUrl]);

  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem('quran_reading_position');

      if (!savedPosition) {
        return;
      }

      const position = JSON.parse(savedPosition);
      if (!position.surahNumber || !position.ayahNumber) {
        return;
      }

      const normalizedPosition = {
        surahNumber: Number(position.surahNumber),
        ayahNumber: Number(position.ayahNumber),
        updatedAt: position.updatedAt || Date.now()
      };

      setLastPlayedPosition(normalizedPosition);
    } catch (error) {
      console.error('Error restoring reading position:', error);
      localStorage.removeItem('quran_reading_position');
    }
  }, [surahs]);

  const dataValue = useMemo(
    () => ({
      surahs,
      loading,
      audioMappings,
      tafseerMappings,
      customUrls,
      currentSurah,
      lastPlayedPosition,
      theme,
      language,
    enablePrimaryAudio,
    enableSupplementalAudio,
      bookmarks,
      setCurrentSurah,
      saveAudioMapping,
      deleteAudioMapping,
      saveTafseerMapping,
      deleteTafseerMapping,
      createCustomUrl,
      updateCustomUrl,
      deleteCustomUrl,
      saveCustomUrl,
      getCustomUrlById,
      getAudioUrl,
      getTafseer,
      fetchSurahVerses,
      fetchCustomUrls,
      setThemePreference,
      setLanguagePreference,
    setPrimaryAudioEnabled,
    setSupplementalAudioEnabled,
      toggleBookmark,
      removeBookmark,
      updateBookmarkNote
    }),
    [
      surahs,
      loading,
      audioMappings,
      tafseerMappings,
      customUrls,
      currentSurah,
      lastPlayedPosition,
      theme,
      language,
    enablePrimaryAudio,
    enableSupplementalAudio,
      bookmarks,
      saveAudioMapping,
      deleteAudioMapping,
      saveTafseerMapping,
      deleteTafseerMapping,
      createCustomUrl,
      updateCustomUrl,
      deleteCustomUrl,
      saveCustomUrl,
      getCustomUrlById,
      getAudioUrl,
      getTafseer,
      fetchSurahVerses,
      fetchCustomUrls,
      setThemePreference,
      setLanguagePreference,
      setPrimaryAudioEnabled,
      setSupplementalAudioEnabled,
      toggleBookmark,
      removeBookmark,
      updateBookmarkNote
    ]
  );

  const audioValue = useMemo(
    () => ({
      currentAudio,
      playingAyah,
      isPaused,
      playAudio,
      pauseAudio,
      resumeAudio,
      stopAudio
    }),
    [currentAudio, playingAyah, isPaused, playAudio, pauseAudio, resumeAudio, stopAudio]
  );

  return (
    <QuranDataContext.Provider value={dataValue}>
      <QuranAudioContext.Provider value={audioValue}>
        {children}
      </QuranAudioContext.Provider>
    </QuranDataContext.Provider>
  );
};