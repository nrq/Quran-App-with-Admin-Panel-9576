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
import {
  getLocalTranslationLabel,
  hasLocalTranslation,
  loadLocalTranslationForSurah
} from '../data/localTranslations';

const SUPPORTED_THEMES = ['green', 'red', 'blue', 'light', 'dark', 'sepia'];
const DEFAULT_THEME = 'light';

const LANGUAGE_CONFIG = {
  English: {
    code: 'en',
    translationEdition: 'en.sahih',
    label: 'Saheeh International'
  },
  Urdu: {
    code: 'ur',
    translationEdition: 'ur.junagarhi',
    label: 'Ahmed Ali (Junagarhi)'
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

const DEFAULT_LANGUAGE = 'Urdu';

const ARABIC_DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g;
const ARABIC_LETTER_REGEX = /[\u0600-\u06FF]/;

const stripArabicDiacritics = (text = '') => text.replace(ARABIC_DIACRITICS_REGEX, '');

const AUDIO_PREFERENCES_STORAGE_KEY = 'quran_audio_preferences';
const SEARCH_TRANSLATIONS_PREF_KEY = 'quran_search_include_translations';

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
  const [includeTranslationsInSearch, setIncludeTranslationsInSearch] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      const stored = localStorage.getItem(SEARCH_TRANSLATIONS_PREF_KEY);
      if (stored === null) {
        return true;
      }
      return stored === 'true';
    } catch (error) {
      console.error('Failed to restore search translation preference:', error);
      return true;
    }
  });
  const audioRef = useRef(null);
  const translationsCacheRef = useRef({});
  const translationWarningRef = useRef(new Set());
  const supplementalAudioPhaseRef = useRef('primary');
  const pendingSupplementalUrlRef = useRef(null);
  const searchIndexRef = useRef(null);
  const searchIndexPromiseRef = useRef(null);
  const translationPrefetchRef = useRef(false);

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
    return `https://nrq.no/wp-content/uploads/ayah/${paddedSurah}-${paddedAyah}.mp3`;
  }, []);

  const ensureSearchIndex = useCallback(async () => {
    if (searchIndexRef.current) {
      return searchIndexRef.current;
    }

    if (!searchIndexPromiseRef.current) {
      searchIndexPromiseRef.current = (async () => {
        try {
          const { getAllQuranData } = await import('../data/quran-data.js');
          const data = await getAllQuranData();
          if (!data) {
            const emptyIndex = { verses: [], verseMap: new Map() };
            searchIndexRef.current = emptyIndex;
            return emptyIndex;
          }

          const verses = [];
          const verseMap = new Map();

          Object.entries(data).forEach(([surahKey, surahData]) => {
            const surahNumber = Number(surahKey);
            const verseEntries = Array.isArray(surahData?.verses) ? surahData.verses : [];

            verseEntries.forEach((verse) => {
              const textArabic = verse.text_uthmani || '';
              const textArabicPlain = stripArabicDiacritics(textArabic);
              const wordsOriginal = textArabic.trim().split(/\s+/).filter(Boolean);
              const wordsPlain = wordsOriginal.map((word) => stripArabicDiacritics(word));

              const entry = {
                surahNumber,
                ayahNumber: Number(verse.verse_number) || 0,
                textArabic,
                textArabicPlain,
                wordsOriginal,
                wordsPlain
              };

              verses.push(entry);
              verseMap.set(`${surahNumber}:${entry.ayahNumber}`, entry);
            });
          });

          const builtIndex = { verses, verseMap };
          searchIndexRef.current = builtIndex;
          return builtIndex;
        } catch (error) {
          console.error('Error building search index:', error);
          const fallbackIndex = { verses: [], verseMap: new Map() };
          searchIndexRef.current = fallbackIndex;
          return fallbackIndex;
        } finally {
          searchIndexPromiseRef.current = null;
        }
      })();
    }

    return searchIndexPromiseRef.current;
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

      if (hasLocalTranslation(edition)) {
        try {
          const local = await loadLocalTranslationForSurah(edition, surahNumber);

          if (local?.entries) {
            const normalized = {
              edition,
              languageKey: languageKeyToUse,
              name: getLocalTranslationLabel(edition) || languageMeta.label,
              entries: local.entries
            };

            translationsCacheRef.current[cacheKey] = normalized;

            try {
              localStorage.setItem(storageKey, JSON.stringify(normalized));
            } catch (storageError) {
              console.error('Failed to persist translation cache:', storageError);
            }

            return normalized;
          }
        } catch (localError) {
          console.warn('Local translation load failed, attempting remote fallback', {
            edition,
            surahNumber,
            error: localError?.message || localError
          });
        }
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

  const searchQuran = useCallback(
    async (rawQuery) => {
      const trimmedQuery = typeof rawQuery === 'string' ? rawQuery.trim() : '';
      if (!trimmedQuery) {
        return [];
      }

      const lowerQuery = trimmedQuery.toLowerCase();
      const tokens = lowerQuery.split(/\s+/).filter(Boolean);
      const numericTokens = tokens.filter((token) => /^\d+$/.test(token));
      const wantsLastAyah = tokens.includes('last');
      const textualTokens = tokens
        .filter((token) => !/^\d+$/.test(token) && token !== 'last')
        .map((token) => token.replace(/[^a-z\u0600-\u06FF]/g, ''))
        .filter(Boolean);
      const hasArabicQuery = ARABIC_LETTER_REGEX.test(trimmedQuery);

      const index = await ensureSearchIndex();
      const surahLookup = surahs || [];
      const translationCache = new Map();

      const ayahResults = [];
      const surahResults = [];
      const seenAyahKeys = new Set();
      const seenSurahIds = new Set();

      const buildSnippet = (entry) => {
        const { wordsOriginal, wordsPlain, textArabic } = entry;
        if (!wordsOriginal.length) {
          return textArabic.split(/\s+/).slice(0, 3).join(' ');
        }

        let startIndex = 0;

        if (hasArabicQuery) {
          const normalizedQuery = stripArabicDiacritics(trimmedQuery).replace(/\s+/g, ' ').trim();
          if (normalizedQuery) {
            const matchIndex = wordsPlain.findIndex((word) => word.includes(normalizedQuery));
            if (matchIndex !== -1) {
              startIndex = Math.max(0, matchIndex - 1);
            }
          }
        }

        const snippetWords = wordsOriginal.slice(startIndex, startIndex + 3);
        if (!snippetWords.length) {
          return wordsOriginal.slice(0, 3).join(' ');
        }
        return snippetWords.join(' ');
      };

      const buildTranslationSnippet = (text) => {
        if (!text) {
          return '';
        }

        const words = text.split(/\s+/).filter(Boolean);
        if (words.length <= 20) {
          return text;
        }
        return `${words.slice(0, 20).join(' ')}…`;
      };

      const getTranslationForEntry = async (entry) => {
        if (!includeTranslationsInSearch) {
          return null;
        }

        if (!language) {
          return null;
        }

        const cached = translationCache.get(entry.surahNumber);
        let translationData = cached;

        if (!translationData) {
          translationData = await fetchTranslationForSurah(language, entry.surahNumber);
          translationCache.set(entry.surahNumber, translationData);
        }

        if (!translationData || !translationData.entries) {
          return null;
        }

        return (
          translationData.entries[entry.ayahNumber] ||
          translationData.entries[String(entry.ayahNumber)] ||
          null
        );
      };

      const addAyahResult = (entry) => {
        if (!entry) {
          return;
        }

        const key = `${entry.surahNumber}:${entry.ayahNumber}`;
        if (seenAyahKeys.has(key)) {
          if (entry.translationSnippet) {
            const existingIndex = ayahResults.findIndex((result) => result.id === key);
            if (existingIndex !== -1) {
              ayahResults[existingIndex] = {
                ...ayahResults[existingIndex],
                translationSnippet: entry.translationSnippet
              };
            }
          }
          return;
        }

        const surahInfo = surahLookup.find((item) => item.id === entry.surahNumber);
        ayahResults.push({
          type: 'ayah',
          id: key,
          surahNumber: entry.surahNumber,
          ayahNumber: entry.ayahNumber,
          snippet: buildSnippet(entry),
          translationSnippet: entry.translationSnippet || '',
          arabic: entry.textArabic,
          surahName: surahInfo?.name_simple || `Surah ${entry.surahNumber}`,
          surahArabicName: surahInfo?.name_arabic || '',
          surahEnglishName: surahInfo?.translated_name?.name || '',
          versesCount: surahInfo?.verses_count || 0
        });
        seenAyahKeys.add(key);
      };

      const addSurahResult = (surah) => {
        if (!surah || seenSurahIds.has(surah.id)) {
          return;
        }

        surahResults.push({
          type: 'surah',
          id: `surah-${surah.id}`,
          surahNumber: surah.id,
          name: surah.name_simple,
          arabicName: surah.name_arabic,
          englishName: surah.translated_name?.name || '',
          versesCount: surah.verses_count
        });
        seenSurahIds.add(surah.id);
      };

      const parseDirectReference = () => {
        const colonMatch = trimmedQuery.match(/^(\d{1,3})\s*[:-]\s*(\d{1,3})$/);
        if (colonMatch) {
          return {
            surahNumber: Number(colonMatch[1]),
            ayahNumber: Number(colonMatch[2])
          };
        }

        const spaceMatch = trimmedQuery.match(/^(\d{1,3})\s+(\d{1,3})$/);
        if (spaceMatch) {
          return {
            surahNumber: Number(spaceMatch[1]),
            ayahNumber: Number(spaceMatch[2])
          };
        }

        return null;
      };

      const directReference = parseDirectReference();
      if (directReference) {
        const entry = index.verseMap.get(`${directReference.surahNumber}:${directReference.ayahNumber}`);
        if (entry) {
          addAyahResult(entry);
        }
      }

      const candidateSurahs = [];
      if (surahLookup.length) {
        const hasOnlyNumber = !textualTokens.length && numericTokens.length === 1 && !hasArabicQuery;
        const normalizedQuery = lowerQuery.replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ').trim();

        surahLookup.forEach((surah) => {
          const fields = [
            String(surah.id),
            surah.name_simple,
            surah.translated_name?.name,
            surah.name_arabic,
            stripArabicDiacritics(surah.name_arabic || '')
          ]
            .filter(Boolean)
            .map((value) => value.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' '));

          let matches = false;

          if (hasOnlyNumber) {
            matches = Number(numericTokens[0]) === surah.id;
          } else if (textualTokens.length) {
            matches = textualTokens.every((token) =>
              fields.some((field) => field.includes(token))
            );
          } else if (normalizedQuery) {
            matches = fields.some((field) => field.includes(normalizedQuery));
          }

          if (matches) {
            candidateSurahs.push(surah);
          }
        });
      }

      candidateSurahs.forEach((surah) => {
        addSurahResult(surah);

        let ayahNumber = null;
        if (wantsLastAyah) {
          ayahNumber = surah.verses_count;
        } else if (numericTokens.length) {
          const possibleAyah = Number(numericTokens[0]);
          if (Number.isInteger(possibleAyah) && possibleAyah >= 1) {
            ayahNumber = possibleAyah;
          }
        }

        if (ayahNumber) {
          const entry = index.verseMap.get(`${surah.id}:${ayahNumber}`);
          if (entry) {
            addAyahResult(entry);
          }
        }
      });

      if (hasArabicQuery) {
        const normalizedQuery = stripArabicDiacritics(trimmedQuery).replace(/\s+/g, ' ').trim();
        if (normalizedQuery) {
          for (const entry of index.verses) {
            if (entry.textArabicPlain.includes(normalizedQuery)) {
              addAyahResult(entry);
            }
          }
        }
      }

      if (includeTranslationsInSearch && textualTokens.length) {
        for (const entry of index.verses) {
          const translationText = await getTranslationForEntry(entry);
          if (!translationText) {
            continue;
          }

          const normalizedTranslation = translationText.toLowerCase();
          const matchesAllTokens = textualTokens.every((token) => normalizedTranslation.includes(token));
          if (matchesAllTokens) {
            addAyahResult({ ...entry, translationSnippet: buildTranslationSnippet(translationText) });
          }
        }
      }

      return [...ayahResults, ...surahResults];
    },
    [
      ensureSearchIndex,
      fetchTranslationForSurah,
      includeTranslationsInSearch,
      language,
      surahs
    ]
  );

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

      const savedSearchPref = localStorage.getItem(SEARCH_TRANSLATIONS_PREF_KEY);
      if (savedSearchPref !== null) {
        setIncludeTranslationsInSearch(savedSearchPref === 'true');
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

  const setSearchTranslationsEnabled = useCallback((value) => {
    const normalizedValue = Boolean(value);
    setIncludeTranslationsInSearch(normalizedValue);
    try {
      localStorage.setItem(SEARCH_TRANSLATIONS_PREF_KEY, String(normalizedValue));
    } catch (error) {
      console.error('Failed to persist search translation preference:', error);
    }
  }, []);

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

  const cacheAudioIfPossible = useCallback(async (url) => {
    if (!url || typeof url !== 'string') {
      return;
    }

    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open('dq-audio-v1');
      const existing = await cache.match(url);
      if (!existing) {
        const response = await fetch(url, { mode: 'no-cors', credentials: 'omit' });
        if (response && (response.ok || response.type === 'opaque')) {
          await cache.put(url, response.clone());
        }
      }
    } catch (error) {
      console.warn('Audio cache skip:', {
        url,
        error: error?.message || error
      });
    }
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

  useEffect(() => {
    if (!surahs.length || translationPrefetchRef.current) {
      return;
    }

    translationPrefetchRef.current = true;
    let canceled = false;
    const languagesToPrefetch = ['Urdu', 'English'];
    const scheduledIds = new Set();

    const schedulePrefetch = (index) => {
      if (canceled || index >= surahs.length) {
        return;
      }

      const execute = async () => {
        if (canceled) {
          return;
        }

        const surah = surahs[index];
        if (!surah) {
          schedulePrefetch(index + 1);
          return;
        }

        for (const languageKey of languagesToPrefetch) {
          if (canceled) {
            break;
          }

          try {
            await fetchTranslationForSurah(languageKey, surah.id);
          } catch (error) {
            console.warn('Background translation prefetch failed:', {
              language: languageKey,
              surahId: surah.id,
              error: error?.message || error
            });
          }
        }

        schedulePrefetch(index + 1);
      };

      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        const idleId = window.requestIdleCallback(() => {
          scheduledIds.delete(idleId);
          execute();
        });
        scheduledIds.add(idleId);
      } else {
        const timeoutId = setTimeout(() => {
          scheduledIds.delete(timeoutId);
          execute();
        }, 150);
        scheduledIds.add(timeoutId);
      }
    };

    schedulePrefetch(0);

    return () => {
      canceled = true;
      scheduledIds.forEach((id) => {
        if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(id);
        } else {
          clearTimeout(id);
        }
      });
      scheduledIds.clear();
    };
  }, [fetchTranslationForSurah, surahs]);

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
      const normalizedSurahNumber = Number(surahNumber);
      const normalizedAyahNumber = Number(ayahNumber);

      if (
        !Number.isInteger(normalizedSurahNumber) ||
        !Number.isInteger(normalizedAyahNumber) ||
        normalizedSurahNumber < 1 ||
        normalizedSurahNumber > 114 ||
        normalizedAyahNumber < 1
      ) {
        console.warn('Invalid surah/ayah provided to playAudio', {
          surahNumber,
          ayahNumber
        });
        return;
      }

      const ayahKey = `${normalizedSurahNumber}:${normalizedAyahNumber}`;
      const shouldPlayPrimary = enablePrimaryAudio;
      const supplementalUrl = enableSupplementalAudio
        ? getSupplementalAudioUrl(normalizedSurahNumber, normalizedAyahNumber)
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
      persistReadingPosition(normalizedSurahNumber, normalizedAyahNumber);
      supplementalAudioPhaseRef.current = 'primary';
      pendingSupplementalUrlRef.current = supplementalUrl;

      const currentSurahData = surahs.find((surah) => surah.id === normalizedSurahNumber);

      const advanceToNextOrStop = () => {
        const shouldAutoAdvance =
          autoPlayNext && currentSurahData && normalizedAyahNumber < currentSurahData.verses_count;

        if (shouldAutoAdvance) {
          destroyCurrentAudio();
          playAudio(normalizedSurahNumber, normalizedAyahNumber + 1, true);
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
          // Silently skip missing supplemental audio files and continue to next ayah
          console.warn('Supplemental audio file not found, skipping to next ayah:', {
            surah: normalizedSurahNumber,
            ayah: normalizedAyahNumber,
            url: supplementalAudioUrl
          });
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
            // Silently skip missing supplemental audio files and continue to next ayah
            console.warn('Supplemental audio play failed, skipping to next ayah:', {
              surah: normalizedSurahNumber,
              ayah: normalizedAyahNumber,
              error: error.message
            });
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
        cacheAudioIfPossible(supplementalUrl);
        if (currentSurahData && normalizedAyahNumber < currentSurahData.verses_count) {
          const nextAyahNumber = normalizedAyahNumber + 1;
          if (enableSupplementalAudio) {
            const nextSupplementalUrl = getSupplementalAudioUrl(normalizedSurahNumber, nextAyahNumber);
            cacheAudioIfPossible(nextSupplementalUrl);
          }
        }
        playSupplementalAudio(true);
        return;
      }

    const audioUrl = getAudioUrl(normalizedSurahNumber, normalizedAyahNumber);
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
        // Silently skip missing primary audio files and continue to next ayah
        console.warn('Primary audio file not found, skipping to next ayah:', {
          surah: normalizedSurahNumber,
          ayah: normalizedAyahNumber,
          url: audioUrl
        });
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

      cacheAudioIfPossible(audioUrl);
      if (supplementalUrl) {
        cacheAudioIfPossible(supplementalUrl);
      }

      if (currentSurahData && normalizedAyahNumber < currentSurahData.verses_count) {
        const nextAyahNumber = normalizedAyahNumber + 1;
        if (shouldPlayPrimary) {
          const nextPrimaryUrl = getAudioUrl(normalizedSurahNumber, nextAyahNumber);
          cacheAudioIfPossible(nextPrimaryUrl);
        }
        if (enableSupplementalAudio) {
          const nextSupplementalUrl = getSupplementalAudioUrl(normalizedSurahNumber, nextAyahNumber);
          cacheAudioIfPossible(nextSupplementalUrl);
        }
      }

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          // Silently skip missing primary audio files and continue to next ayah
          console.warn('Primary audio play failed, skipping to next ayah:', {
            surah: normalizedSurahNumber,
            ayah: normalizedAyahNumber,
            error: error.message
          });
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
      cacheAudioIfPossible,
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
      getSupplementalAudioUrl,
      getTafseer,
      fetchSurahVerses,
      fetchCustomUrls,
      setThemePreference,
      setLanguagePreference,
      searchQuran,
      includeTranslationsInSearch,
      setSearchTranslationsEnabled,
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
      getSupplementalAudioUrl,
      getTafseer,
      fetchSurahVerses,
      fetchCustomUrls,
      setThemePreference,
      setLanguagePreference,
      searchQuran,
      includeTranslationsInSearch,
      setSearchTranslationsEnabled,
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