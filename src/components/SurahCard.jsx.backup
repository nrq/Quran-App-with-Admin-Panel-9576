import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiBook, FiMapPin } = FiIcons;

const SurahCard = ({ surah, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/surah/${surah.id}`} className="block">
        <div className="surah-card p-6 rounded-xl hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-islamic-gold to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{surah.id}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-islamic-800">{surah.name_simple}</h3>
                <p className="text-islamic-600 text-sm">{surah.translated_name.name}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="arabic-text text-2xl text-islamic-800 mb-2">
                {surah.name_arabic}
              </div>
              <div className="flex items-center space-x-2 text-islamic-500 text-sm">
                <SafeIcon icon={FiMapPin} className="text-xs" />
                <span>{surah.revelation_place}</span>
                <span>•</span>
                <SafeIcon icon={FiBook} className="text-xs" />
                <span>{surah.verses_count} verses</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default SurahCard;