import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useQuran } from '../contexts/QuranContext';
import toast from 'react-hot-toast';

const { FiLogOut, FiMusic, FiSave, FiPlay, FiSearch, FiBook } = FiIcons;

const AdminPanel = () => {
  const { logout } = useAuth();
  const { surahs, audioMappings, tafseerMappings, saveAudioMapping, saveTafseerMapping } = useQuran();
  const [activeTab, setActiveTab] = useState('audio'); // 'audio' or 'tafseer'
  const [selectedSurah, setSelectedSurah] = useState('');
  const [ayahNumber, setAyahNumber] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [tafseerText, setTafseerText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveAudio = () => {
    if (!selectedSurah || !ayahNumber || !audioUrl) {
      toast.error('Please fill all fields');
      return;
    }

    saveAudioMapping(parseInt(selectedSurah), parseInt(ayahNumber), audioUrl);
    setAyahNumber('');
    setAudioUrl('');
  };

  const handleSaveTafseer = () => {
    if (!selectedSurah || !ayahNumber || !tafseerText) {
      toast.error('Please fill all fields');
      return;
    }

    saveTafseerMapping(parseInt(selectedSurah), parseInt(ayahNumber), tafseerText);
    setAyahNumber('');
    setTafseerText('');
  };

  const handleTestAudio = () => {
    if (!audioUrl) {
      toast.error('Please enter audio URL');
      return;
    }

    const audio = new Audio(audioUrl);
    
    audio.addEventListener('error', () => {
      toast.error('Invalid audio URL');
    });
    
    audio.play().catch(() => {
      toast.error('Failed to play audio');
    });
  };

  const filteredSurahs = surahs.filter(surah => 
    surah.name_simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.translated_name.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMappingsForSurah = (surahId, mappings) => {
    return Object.entries(mappings)
      .filter(([key]) => key.startsWith(`${surahId}:`))
      .map(([key, value]) => ({
        ayah: key.split(':')[1],
        value
      }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-50 to-islamic-100">
      <nav className="bg-white shadow-lg border-b border-islamic-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-islamic-800">Admin Panel</h1>
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiLogOut} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-islamic-200 mb-6">
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-6 font-medium ${
              activeTab === 'audio'
                ? 'text-islamic-gold border-b-2 border-islamic-gold'
                : 'text-islamic-600 hover:text-islamic-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiMusic} />
              <span>Audio Mapping</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tafseer')}
            className={`py-3 px-6 font-medium ${
              activeTab === 'tafseer'
                ? 'text-islamic-gold border-b-2 border-islamic-gold'
                : 'text-islamic-600 hover:text-islamic-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiBook} />
              <span>Tafseer Management</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="admin-panel p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <SafeIcon 
                icon={activeTab === 'audio' ? FiMusic : FiBook} 
                className="text-islamic-gold text-2xl" 
              />
              <h2 className="text-xl font-bold text-islamic-800">
                {activeTab === 'audio' ? 'Audio Mapping' : 'Tafseer Management'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-islamic-700 mb-2">
                  Select Surah
                </label>
                <select
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(e.target.value)}
                  className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                >
                  <option value="">Choose a Surah</option>
                  {surahs.map(surah => (
                    <option key={surah.id} value={surah.id}>
                      {surah.id}. {surah.name_simple} - {surah.translated_name.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-islamic-700 mb-2">
                  Ayah Number
                </label>
                <input
                  type="number"
                  value={ayahNumber}
                  onChange={(e) => setAyahNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                  placeholder="Enter ayah number"
                  min="1"
                />
              </div>

              {activeTab === 'audio' ? (
                <div>
                  <label className="block text-sm font-medium text-islamic-700 mb-2">
                    Audio URL
                  </label>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                    placeholder="https://everyayah.com/data/..."
                  />
                  <p className="text-xs text-islamic-500 mt-1">
                    Default format: https://everyayah.com/data/Alafasy_128kbps/SSSAAA.mp3
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-islamic-700 mb-2">
                    Tafseer Text
                  </label>
                  <textarea
                    value={tafseerText}
                    onChange={(e) => setTafseerText(e.target.value)}
                    className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                    placeholder="Enter tafseer explanation..."
                    rows={6}
                  />
                </div>
              )}

              <div className="flex space-x-3">
                {activeTab === 'audio' && (
                  <button
                    onClick={handleTestAudio}
                    className="flex items-center space-x-2 bg-islamic-600 hover:bg-islamic-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiPlay} />
                    <span>Test Audio</span>
                  </button>
                )}
                
                <button
                  onClick={activeTab === 'audio' ? handleSaveAudio : handleSaveTafseer}
                  className="flex items-center space-x-2 bg-islamic-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiSave} />
                  <span>Save {activeTab === 'audio' ? 'Audio' : 'Tafseer'}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Current Mappings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="admin-panel p-6"
          >
            <h2 className="text-xl font-bold text-islamic-800 mb-6">
              Current {activeTab === 'audio' ? 'Audio Mappings' : 'Tafseer Entries'}
            </h2>
            
            <div className="mb-4">
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-islamic-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                  placeholder="Search surahs..."
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredSurahs.map(surah => {
                const mappings = getMappingsForSurah(
                  surah.id, 
                  activeTab === 'audio' ? audioMappings : tafseerMappings
                );
                
                if (mappings.length === 0) return null;
                
                return (
                  <div key={surah.id} className="border border-islamic-200 rounded-lg p-3">
                    <div className="font-medium text-islamic-800 mb-2">
                      {surah.id}. {surah.name_simple}
                    </div>
                    <div className="space-y-1">
                      {mappings.map(mapping => (
                        <div key={mapping.ayah} className="text-sm text-islamic-600 bg-islamic-50 p-2 rounded">
                          Ayah {mapping.ayah}: {activeTab === 'audio' 
                            ? 'Custom audio assigned' 
                            : `${mapping.value.substring(0, 50)}${mapping.value.length > 50 ? '...' : ''}`
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="admin-panel p-6 mt-8"
        >
          <h2 className="text-xl font-bold text-islamic-800 mb-6">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-islamic-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-islamic-gold">{surahs.length}</div>
              <div className="text-islamic-600">Total Surahs</div>
            </div>
            <div className="bg-islamic-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-islamic-gold">
                {Object.keys(audioMappings).length}
              </div>
              <div className="text-islamic-600">Custom Audio Mappings</div>
            </div>
            <div className="bg-islamic-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-islamic-gold">
                {Object.keys(tafseerMappings).length}
              </div>
              <div className="text-islamic-600">Tafseer Entries</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;