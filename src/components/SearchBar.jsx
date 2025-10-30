import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';

const {
  FiSearch,
  FiX,
  FiArrowRight,
  FiList,
  FiBookmark,
  FiChevronsRight,
  FiArrowUpCircle
} = FiIcons;

const RECENT_SEARCHES_KEY = 'quran_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const TOTAL_SURAHS = 114;
const ARTICLE_PREFIXES = new Set([
  'al',
  'an',
  'ar',
  'as',
  'ash',
  'az',
  'ad',
  'at'
]);

const stripLeadingArticle = (name) => {
  if (!name) {
    return '';
  }

  const parts = name.split('-');
  if (parts.length <= 1) {
    return name;
  }

  const [possiblePrefix, ...rest] = parts;
  const normalized = possiblePrefix.toLowerCase();

  if (normalized.length >= 2 && normalized.length <= 3 && ARTICLE_PREFIXES.has(normalized)) {
    const remainder = rest.join('-');
    return remainder || name;
  }

  return name;
};

const saveRecentSearch = (searchTerm) => {
  if (!searchTerm.trim()) return;

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    const recentSearches = stored ? JSON.parse(stored) : [];

    // Remove duplicate if exists
    const filtered = recentSearches.filter(term => term !== searchTerm);

    // Add to beginning and limit to MAX_RECENT_SEARCHES
    const updated = [searchTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent search:', error);
  }
};

const getRecentSearches = () => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get recent searches:', error);
    return [];
  }
};

const SearchBar = ({ variant = 'global' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuran, surahs } = useQuranData();
  const isNavVariant = variant === 'nav';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(isNavVariant);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);

  const hasQuery = query.trim().length > 0;
  const isExpanded = isNavVariant || isOpen || hasQuery || isFocused;

  const currentSurahNumber = useMemo(() => {
    const match = location.pathname.match(/^\/surah\/(\d+)/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }, [location.pathname]);

  const currentSurah = useMemo(() => {
    if (!Array.isArray(surahs) || !currentSurahNumber) {
      return null;
    }

    return surahs.find((item) => item.id === currentSurahNumber) || null;
  }, [currentSurahNumber, surahs]);

  const currentAyahFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const ayahValue = Number(params.get('ayah'));
    return Number.isInteger(ayahValue) && ayahValue > 0 ? ayahValue : null;
  }, [location.search]);

  const nextSurahNumber = useMemo(() => {
    if (!currentSurahNumber) {
      return 1;
    }

    return currentSurahNumber >= TOTAL_SURAHS ? 1 : currentSurahNumber + 1;
  }, [currentSurahNumber]);

  const nextSurah = useMemo(() => {
    if (!Array.isArray(surahs)) {
      return null;
    }

    return surahs.find((item) => item.id === nextSurahNumber) || null;
  }, [nextSurahNumber, surahs]);

  const nextSurahLabel = useMemo(() => {
    if (!nextSurah) {
      return 'Next';
    }

    const stripped = stripLeadingArticle(nextSurah.name_simple);
    const safeName = stripped || nextSurah.name_simple || '';
    return `${nextSurah.id} ${safeName}`.trim();
  }, [nextSurah]);

  const currentSurahReference = useMemo(() => {
    if (!currentSurah) {
      return null;
    }

    const reference = currentAyahFromQuery
      ? `${currentSurah.id}:${currentAyahFromQuery}`
      : `${currentSurah.id}`;

    return {
      english: currentSurah.name_simple,
      arabic: currentSurah.name_arabic,
      reference
    };
  }, [currentAyahFromQuery, currentSurah]);

  useEffect(() => {
    // Load recent searches on mount
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    setIsFocused(false);
    if (!isNavVariant) {
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  }, [location.pathname, location.search, isNavVariant]);

  useEffect(() => {
    let isCancelled = false;

    if (!searchQuran) {
      return undefined;
    }

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const matches = await searchQuran(query);
        if (!isCancelled) {
          setResults(Array.isArray(matches) ? matches : []);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Search error:', error);
          setResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 160);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, searchQuran]);

  const handleSelect = useCallback(
    (result) => {
      if (!result) {
        return;
      }

      // Save the search term to recent searches
      if (query.trim()) {
        saveRecentSearch(query.trim());
        setRecentSearches(getRecentSearches());
      }

      if (result.type === 'ayah') {
        navigate(`/surah/${result.surahNumber}?ayah=${result.ayahNumber}`);
      } else if (result.type === 'surah') {
        navigate(`/surah/${result.surahNumber}`);
      }

      setQuery('');
      setResults([]);
      setIsFocused(false);
      setIsOpen(isNavVariant);
    },
    [isNavVariant, navigate, query]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
    setIsOpen(isNavVariant);
    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    });
  }, [isNavVariant]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        handleClear();
        event.currentTarget.blur();
        return;
      }

      if (event.key === 'Enter' && results.length) {
        event.preventDefault();
        handleSelect(results[0]);
      }
    },
    [handleClear, handleSelect, results]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (isNavVariant) {
      return;
    }

    if (query.trim()) {
      return;
    }

    window.setTimeout(() => {
      setIsOpen(false);
    }, 120);
  }, [isNavVariant, query]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  }, []);

  const handleRecentSearchClick = useCallback((term) => {
    setQuery(term);
    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  }, []);

  const closeSearchPanel = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
    setIsOpen(isNavVariant);
  }, [isNavVariant]);

  const handleNextSurah = useCallback(() => {
    navigate(`/surah/${nextSurahNumber}`);
    closeSearchPanel();
  }, [closeSearchPanel, navigate, nextSurahNumber]);

  const handleScrollToTop = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    closeSearchPanel();
  }, [closeSearchPanel]);

  const handleViewBookmarks = useCallback(() => {
    navigate('/bookmarks');
    closeSearchPanel();
  }, [closeSearchPanel, navigate]);

  const showResults = isExpanded && hasQuery && (isFocused || isLoading || results.length > 0);
  const showRecentSearches = isExpanded && !hasQuery && isFocused && recentSearches.length > 0;

  const placeholderText = useMemo(
    () => 'Nis Last, Rahman 22, 15:20, Cave 44, كدأب',
    []
  );

  if (!searchQuran) {
    return null;
  }

  const containerClasses = isNavVariant
    ? 'relative w-full max-w-xl pointer-events-auto'
    : 'fixed top-6 left-1/2 z-50 w-full -translate-x-1/2 px-4 pointer-events-none';

  const outerWrapperClasses = isNavVariant
    ? 'pointer-events-auto w-full'
    : 'pointer-events-none flex w-full justify-center';

  const innerWidthClasses = isNavVariant
    ? 'pointer-events-auto w-full transition-all duration-300'
    : 'pointer-events-auto w-full md:w-1/2 max-w-2xl transition-all duration-300';

  const cardClasses = isNavVariant
    ? 'bg-white border border-slate-200 shadow-2xl rounded-2xl px-4 py-2'
    : 'bg-white border border-slate-200 shadow-2xl rounded-2xl px-5 py-4';

  const inputWrapperClasses = isNavVariant
    ? `flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-1.5 transition-all duration-200 ${isFocused ? 'ring-2 ring-islamic-gold shadow-lg' : 'shadow-sm'
    }`
    : `flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-2 transition-all duration-200 ${isFocused ? 'ring-2 ring-islamic-gold shadow-lg' : 'shadow-sm'
    }`;

  const resultsWrapperClasses = isNavVariant
    ? 'absolute left-1/2 top-full z-50 mt-3 w-[min(36rem,90vw)] -translate-x-1/2'
    : 'mt-3 w-full';

  return (
    <div className={containerClasses}>
      <div className={outerWrapperClasses}>
        {!isNavVariant && !isExpanded ? (
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center justify-center rounded-full border border-blue-100 bg-white text-blue-500 shadow-[0_18px_38px_-18px_rgba(59,130,246,0.6)] p-3 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-[0_26px_55px_-18px_rgba(37,99,235,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              aria-label="Open search"
            >
              <SafeIcon icon={FiSearch} className="text-xl" />
            </button>
          </div>
        ) : (
          <div className={innerWidthClasses}>
            <div className={cardClasses}>
              <div className={inputWrapperClasses}>
                <SafeIcon icon={FiSearch} className="text-slate-500 text-lg" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  className={`flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none ${isNavVariant ? 'text-sm md:text-base py-1' : 'text-sm md:text-base'
                    }`}
                  aria-label="Search Quran"
                />
                {hasQuery && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleClear}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <SafeIcon icon={FiX} className="text-lg" />
                  </button>
                )}
              </div>
              {!isNavVariant && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="flex flex-1 justify-start">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleNextSurah}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-islamic-gold px-3 py-1.5 text-xs font-semibold text-white shadow-[0_14px_32px_-18px_rgba(202,138,4,0.55)] hover:bg-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                      aria-label={nextSurah ? `Go to ${nextSurah.name_simple}` : 'Go to next surah'}
                    >
                      <SafeIcon icon={FiChevronsRight} className="text-sm" />
                      <span>{nextSurahLabel}</span>
                    </button>
                  </div>
                  <div className="flex flex-1 justify-center">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleScrollToTop}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_18px_38px_-18px_rgba(5,150,105,0.65)] hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                      aria-label="Scroll to top"
                    >
                      <SafeIcon icon={FiArrowUpCircle} className="text-sm" />
                      <span>Top</span>
                    </button>
                  </div>
                  <div className="flex flex-1 justify-end">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleViewBookmarks}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_18px_38px_-18px_rgba(59,130,246,0.6)] hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      aria-label="View bookmarks"
                    >
                      <SafeIcon icon={FiBookmark} className="text-sm" />
                      <span>Bookmarks</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showRecentSearches && (
              <div className={`${resultsWrapperClasses} bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden`}>
                <div className="px-5 py-3 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold flex items-center gap-2">
                      <SafeIcon icon={FiList} className="text-sm" />
                      Recent Searches
                    </p>
                    {currentSurahReference && (
                      <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-medium text-slate-500 text-right">
                        <span>{currentSurahReference.english}</span>
                        <span className="text-slate-400">{currentSurahReference.arabic}</span>
                        <span>{currentSurahReference.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {recentSearches.map((term, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleRecentSearchClick(term);
                        }}
                        onClick={() => handleRecentSearchClick(term)}
                        className="w-full text-left px-5 py-3 hover:bg-islamic-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-gold flex items-center justify-between gap-4"
                      >
                        <span className="text-sm text-slate-700">{term}</span>
                        <SafeIcon icon={FiSearch} className="text-slate-400 text-sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showResults && (
              <div className={`${resultsWrapperClasses} bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-96`}>
                {isLoading ? (
                  <div className="px-6 py-8 text-center text-sm text-slate-500">Searching…</div>
                ) : (
                  <>
                    <ul className="divide-y divide-slate-100">
                      {results.slice(0, 3).map((result) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleSelect(result);
                            }}
                            onClick={() => handleSelect(result)}
                            className="w-full text-left px-5 py-4 hover:bg-islamic-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-islamic-gold"
                          >
                            {result.type === 'ayah' ? (
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-xs uppercase tracking-wide text-islamic-gold font-semibold mb-1">
                                    Ayah • {result.surahNumber}:{result.ayahNumber}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {result.surahName}
                                    {result.surahEnglishName ? ` • ${result.surahEnglishName}` : ''}
                                  </p>
                                  {result.snippet && (
                                    <p className="mt-1 text-base text-slate-700 quran-text-pak leading-relaxed">
                                      {result.snippet}
                                    </p>
                                  )}
                                </div>
                                <SafeIcon icon={FiArrowRight} className="text-slate-400 mt-1" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                                    Surah • {result.surahNumber}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {result.name}
                                    {result.englishName ? ` • ${result.englishName}` : ''}
                                  </p>
                                  <p className="text-base text-slate-700 mt-1 quran-text-pak">
                                    {result.arabicName}
                                  </p>
                                </div>
                                <SafeIcon icon={FiArrowRight} className="text-slate-400" />
                              </div>
                            )}
                          </button>
                        </li>
                      ))}
                      {!results.length && !isLoading && (
                        <li className="px-6 py-8 text-center text-sm text-slate-500">
                          No matches yet. Try another phrase.
                        </li>
                      )}
                    </ul>

                    {results.length > 3 && (
                      <div className="border-t border-slate-100 p-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (query.trim()) {
                              saveRecentSearch(query.trim());
                              setRecentSearches(getRecentSearches());
                            }
                            navigate(`/search?q=${encodeURIComponent(query)}`);
                            setQuery('');
                            setResults([]);
                            setIsFocused(false);
                            setIsOpen(isNavVariant);
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                          <SafeIcon icon={FiList} className="text-lg" />
                          <span>View All {results.length} Results</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
