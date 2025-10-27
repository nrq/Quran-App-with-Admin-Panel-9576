import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';

const { FiSearch, FiX, FiArrowRight } = FiIcons;

const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuran } = useQuranData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    setIsFocused(false);
  }, [location.pathname, location.search]);

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

      if (result.type === 'ayah') {
        navigate(`/surah/${result.surahNumber}?ayah=${result.ayahNumber}`);
      } else if (result.type === 'surah') {
        navigate(`/surah/${result.surahNumber}`);
      }

      setQuery('');
      setResults([]);
      setIsFocused(false);
    },
    [navigate]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
  }, []);

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

  const showResults = hasQuery && (isFocused || isLoading || results.length > 0);

  const placeholder = useMemo(
    () => 'Search e.g. 15:20, Cave 44, كدأب',
    []
  );

  if (!searchQuran) {
    return null;
  }

  return (
    <div className="sticky top-4 z-40 flex justify-center">
      <div
        className={`w-full transition-all duration-300 ${
          isFocused || hasQuery ? 'max-w-3xl' : 'max-w-2xl'
        } pointer-events-auto`}
      >
        <div className="backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 border border-white/40 dark:border-slate-700/60 shadow-xl rounded-2xl px-6 py-4">
          <div
            className={`flex items-center gap-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 px-4 py-2 transition-all duration-200 ${
              isFocused ? 'ring-2 ring-islamic-gold shadow-lg' : 'shadow-sm'
            }`}
          >
            <SafeIcon icon={FiSearch} className="text-slate-400 text-lg" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm md:text-base placeholder:text-slate-400 focus:outline-none"
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
          <p className="mt-2 text-xs text-slate-500 text-center">
            Try typing <span className="font-medium text-slate-400">15:20</span>,{' '}
            <span className="font-medium text-slate-400">Cave 44</span>, or{' '}
            <span className="font-medium text-slate-400">كَدَأْبِ</span>
          </p>
        </div>

        {showResults && (
          <div className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-96">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500">Searching…</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((result) => (
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
                            <p className="text-sm font-semibold text-slate-700">
                              {result.surahName}
                              {result.surahEnglishName ? ` • ${result.surahEnglishName}` : ''}
                            </p>
                            {result.snippet && (
                              <p className="mt-1 text-base text-slate-600 quran-text-pak leading-relaxed">
                                {result.snippet}
                              </p>
                            )}
                          </div>
                          <SafeIcon icon={FiArrowRight} className="text-slate-400 mt-1" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">
                              Surah • {result.surahNumber}
                            </p>
                            <p className="text-sm font-semibold text-slate-700">
                              {result.name}
                              {result.englishName ? ` • ${result.englishName}` : ''}
                            </p>
                            <p className="text-base text-slate-500 mt-1 quran-text-pak">
                              {result.arabicName}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {result.versesCount} ayat
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
