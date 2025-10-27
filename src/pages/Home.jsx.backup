import React from 'react';
import { motion } from 'framer-motion';
import SurahCard from '../components/SurahCard';
import { useQuranData } from '../contexts/QuranContext';

const Home = () => {
  const { surahs, loading } = useQuranData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-islamic-600">Loading Quran chapters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-islamic-800 mb-4">
          القرآن الكريم
        </h1>
        <p className="text-xl text-islamic-600 mb-2">The Noble Quran</p>
        <p className="text-islamic-500">
          Listen to the beautiful recitation of the Holy Quran with translations
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surahs.map((surah, index) => (
          <SurahCard key={surah.id} surah={surah} index={index} />
        ))}
      </div>
    </div>
  );
};

export default Home;