import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';

const { FiArrowLeft, FiSettings, FiArrowRight } = FiIcons;

const SearchResults = ({ onOpenSettings }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchQuran } = useQuranData();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const query = useMemo(() => searchParams.get('q') || '', [searchParams]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim() || !searchQuran) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const matches = await searchQuran(query);
        setResults(Array.isArray(matches) ? matches : []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, searchQuran]);

  const handleResultClick = (result) => {
    if (result.type === 'ayah') {
      navigate(`/surah/${result.surahNumber}?ayah=${result.ayahNumber}`);
    } else if (result.type === 'surah') {
      navigate(`/surah/${result.surahNumber}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-islamic-50 to-islamic-100">
        <nav className="bg-white shadow-lg border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-islamic-600 hover:text-islamic-800"
              >
                <SafeIcon icon={FiArrowLeft} />
                <span className="font-medium">Back</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-slate-700 hover:bg-slate-100"
              >
                <SafeIcon icon={FiSettings} className="text-lg" />
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-islamic-600">Searching…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-50 to-islamic-100">
      <nav className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-islamic-600 hover:text-islamic-800"
            >
              <SafeIcon icon={FiArrowLeft} />
              <span className="font-medium">Back</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-slate-700 hover:bg-slate-100"
            >
              <SafeIcon icon={FiSettings} className="text-lg" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-islamic-800 mb-2">Search Results</h1>
          <p className="text-islamic-600">
            Found <span className="font-semibold text-islamic-gold">{results.length}</span> result{results.length !== 1 ? 's' : ''} for "{query}"
          </p>
        </motion.div>

        {results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-12 shadow-lg text-center"
          >
            <p className="text-islamic-600 text-lg">No results found for your search.</p>
            <p className="text-slate-500 mt-2">Try different keywords or phrases.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {results.map((result, index) => (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                type="button"
                onClick={() => handleResultClick(result)}
                className="w-full text-left bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
              >
                {result.type === 'ayah' ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-islamic-gold font-semibold mb-2">
                        Ayah • {result.surahNumber}:{result.ayahNumber}
                      </p>
                      <p className="text-base font-semibold text-slate-900 mb-2">
                        {result.surahName}
                        {result.surahEnglishName ? ` • ${result.surahEnglishName}` : ''}
                      </p>
                      {result.snippet && (
                        <p className="text-lg text-slate-700 quran-text-pak leading-relaxed">
                          {result.snippet}
                        </p>
                      )}
                      {result.translationSnippet && (
                        <p className="text-sm text-slate-600 leading-relaxed mt-3">
                          {result.translationSnippet}
                        </p>
                      )}
                    </div>
                    <SafeIcon icon={FiArrowRight} className="text-slate-400 mt-1 flex-shrink-0" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                        Surah • {result.surahNumber}
                      </p>
                      <p className="text-base font-semibold text-slate-900 mb-2">
                        {result.name}
                        {result.englishName ? ` • ${result.englishName}` : ''}
                      </p>
                      <p className="text-lg text-slate-700 quran-text-pak">
                        {result.arabicName}
                      </p>
                    </div>
                    <SafeIcon icon={FiArrowRight} className="text-slate-400 flex-shrink-0" />
                  </div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
