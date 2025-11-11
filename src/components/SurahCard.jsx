import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevelationPlaceIcon from './RevelationPlaceIcon';
import { useQuranData } from '../contexts/QuranContext';

const THEME_CARD_STYLES = {
  green: 'bg-emerald-50/50 border border-emerald-200 hover:border-emerald-400',
  red: 'bg-rose-50/50 border border-rose-200 hover:border-rose-400',
  blue: 'bg-blue-50/50 border border-blue-200 hover:border-blue-400',
  light: 'bg-white border border-slate-200 hover:border-slate-300',
  dark: 'bg-slate-800/50 border border-slate-700 hover:border-slate-600',
  sepia: 'bg-amber-50/50 border border-amber-300 hover:border-amber-400'
};

const THEME_TEXT_STYLES = {
  green: 'text-emerald-950',
  red: 'text-rose-950',
  blue: 'text-blue-950',
  light: 'text-slate-900',
  dark: 'text-slate-50',
  sepia: 'text-amber-950'
};

const THEME_SECONDARY_TEXT_STYLES = {
  green: 'text-emerald-700',
  red: 'text-rose-700',
  blue: 'text-blue-700',
  light: 'text-slate-600',
  dark: 'text-slate-300',
  sepia: 'text-amber-800'
};

const SurahCard = ({ surah, index }) => {
  const { theme } = useQuranData();
  const cardStyle = THEME_CARD_STYLES[theme] || THEME_CARD_STYLES.green;
  const textStyle = THEME_TEXT_STYLES[theme] || THEME_TEXT_STYLES.green;
  const secondaryTextStyle = THEME_SECONDARY_TEXT_STYLES[theme] || THEME_SECONDARY_TEXT_STYLES.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/surah/${surah.id}`} className="block">
        <div className={`p-6 rounded-xl hover:shadow-xl transition-all duration-300 ${cardStyle}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-islamic-gold to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{surah.id}</span>
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textStyle}`}>{surah.name_simple}</h3>
                <p className={`text-sm ${secondaryTextStyle}`}>{surah.translated_name.name}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`arabic-text text-2xl mb-2 ${textStyle}`}>
                {surah.name_arabic}
              </div>
              <div className={`flex items-center justify-end space-x-3 text-sm ${secondaryTextStyle}`}>
                <RevelationPlaceIcon place={surah.revelation_place} className="w-4 h-4" />
                <span>•</span>
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