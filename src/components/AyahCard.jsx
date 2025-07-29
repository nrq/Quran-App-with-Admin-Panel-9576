import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuran } from '../contexts/QuranContext';

const { FiPlay, FiPause, FiVolume2 } = FiIcons;

const AyahCard = ({ verse, surahNumber, index }) => {
  const { playAudio, stopAudio, currentAudio } = useQuran();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      playAudio(surahNumber, verse.verse_number);
      setIsPlaying(true);
      
      // Listen for audio end
      if (currentAudio) {
        currentAudio.addEventListener('ended', () => {
          setIsPlaying(false);
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`ayah-card bg-white rounded-xl p-6 shadow-md ${isPlaying ? 'playing' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="verse-number">
          {verse.verse_number}
        </div>
        
        <button
          onClick={handlePlayAudio}
          className="flex items-center space-x-2 bg-islamic-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <SafeIcon icon={isPlaying ? FiPause : FiPlay} className="text-sm" />
          <SafeIcon icon={FiVolume2} className="text-sm" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="arabic-text text-islamic-800 text-right leading-loose">
          {verse.text_uthmani}
        </div>
        
        {verse.translations && verse.translations[0] && (
          <div className="english-text text-islamic-600 bg-islamic-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-islamic-500 mb-2">Translation:</p>
            <p>{verse.translations[0].text}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AyahCard;