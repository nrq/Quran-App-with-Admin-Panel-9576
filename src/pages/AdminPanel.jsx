import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useQuran } from '../contexts/QuranContext';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { collection, writeBatch, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { handleFirebaseError, logFirebaseError } from '../utils/firebaseErrorHandler';

const { FiLogOut, FiMusic, FiSave, FiPlay, FiSearch, FiBook, FiDatabase, FiRefreshCw, FiLink, FiEdit, FiExternalLink, FiPlus } = FiIcons;

const AdminPanel = () => {
  const { logout, user } = useAuth();
  const { 
    surahs, 
    audioMappings, 
    tafseerMappings, 
    customUrls,
    saveAudioMapping, 
    saveTafseerMapping,
    saveCustomUrl,
    fetchCustomUrls 
  } = useQuran();
  
  const [activeTab, setActiveTab] = useState('audio'); // 'audio', 'tafseer', or 'urls'
  const [selectedSurah, setSelectedSurah] = useState('');
  const [ayahNumber, setAyahNumber] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedUrlId, setSelectedUrlId] = useState('');
  const [tafseerText, setTafseerText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newUrlTitle, setNewUrlTitle] = useState('');
  const [newUrlDescription, setNewUrlDescription] = useState('');
  const [editingUrlId, setEditingUrlId] = useState(null);
  const [urlsSearchTerm, setUrlsSearchTerm] = useState('');
  
  const [stats, setStats] = useState({
    audioCount: 0,
    tafseerCount: 0,
    urlsCount: 0,
    totalSurahs: 0
  });

  useEffect(() => {
    // Update stats whenever mappings change
    setStats({
      audioCount: Object.keys(audioMappings).length,
      tafseerCount: Object.keys(tafseerMappings).length,
      urlsCount: customUrls.length,
      totalSurahs: surahs.length
    });
  }, [audioMappings, tafseerMappings, customUrls, surahs]);

  useEffect(() => {
    // If a URL is selected, update the audio URL field
    if (selectedUrlId) {
      const selectedUrl = customUrls.find(url => url.id === selectedUrlId);
      if (selectedUrl) {
        setAudioUrl(selectedUrl.url);
      }
    }
  }, [selectedUrlId, customUrls]);

  const handleSaveAudio = () => {
    if (!selectedSurah || !ayahNumber || (!audioUrl && !selectedUrlId)) {
      toast.error('Please fill all required fields');
      return;
    }

    // Get the URL either from direct input or selected custom URL
    const finalUrl = audioUrl || customUrls.find(url => url.id === selectedUrlId)?.url || '';
    const urlTitle = customUrls.find(url => url.id === selectedUrlId)?.title || '';
    
    saveAudioMapping(parseInt(selectedSurah), parseInt(ayahNumber), finalUrl, urlTitle);
    setAyahNumber('');
    setAudioUrl('');
    setSelectedUrlId('');
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
    if (!audioUrl && !selectedUrlId) {
      toast.error('Please enter audio URL or select a custom URL');
      return;
    }

    // Get the URL either from direct input or selected custom URL
    const urlToTest = audioUrl || customUrls.find(url => url.id === selectedUrlId)?.url || '';
    
    if (!urlToTest) {
      toast.error('No valid URL to test');
      return;
    }
    
    const audio = new Audio(urlToTest);
    
    audio.addEventListener('error', () => {
      toast.error('Invalid audio URL');
    });
    
    audio.play().catch(() => {
      toast.error('Failed to play audio');
    });
  };

  // Sync local storage data with Firebase
  const syncWithFirebase = async () => {
    setSyncStatus('syncing');
    try {
      // Get local data
      const localAudio = JSON.parse(localStorage.getItem('quran_audio_mappings') || '{}');
      const localTafseer = JSON.parse(localStorage.getItem('quran_tafseer_mappings') || '{}');
      
      // Prepare batch operations for audio
      const audioEntries = Object.entries(localAudio).map(([key, value]) => {
        const [surahNumber, ayahNumber] = key.split(':');
        const audioUrl = typeof value === 'object' ? value.url : value;
        
        return {
          surah_number: parseInt(surahNumber),
          ayah_number: parseInt(ayahNumber),
          audio_url: audioUrl,
          updated_at: new Date()
        };
      });
      
      // Prepare batch operations for tafseer
      const tafseerEntries = Object.entries(localTafseer).map(([key, text]) => {
        const [surahNumber, ayahNumber] = key.split(':');
        return {
          surah_number: parseInt(surahNumber),
          ayah_number: parseInt(ayahNumber),
          tafseer_text: text,
          updated_at: new Date()
        };
      });
      
      // Execute batch writes using Firestore
      // Firestore has a limit of 500 operations per batch
      const batchSize = 500;
      
      // Process audio entries in batches
      if (audioEntries.length > 0) {
        for (let i = 0; i < audioEntries.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchEntries = audioEntries.slice(i, i + batchSize);
          
          batchEntries.forEach(entry => {
            const docId = `${entry.surah_number}_${entry.ayah_number}`;
            const docRef = doc(db, 'audio_mappings', docId);
            batch.set(docRef, entry, { merge: true });
          });
          
          await batch.commit();
        }
      }
      
      // Process tafseer entries in batches
      if (tafseerEntries.length > 0) {
        for (let i = 0; i < tafseerEntries.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchEntries = tafseerEntries.slice(i, i + batchSize);
          
          batchEntries.forEach(entry => {
            const docId = `${entry.surah_number}_${entry.ayah_number}`;
            const docRef = doc(db, 'tafseer_entries', docId);
            batch.set(docRef, entry, { merge: true });
          });
          
          await batch.commit();
        }
      }
      
      setSyncStatus('success');
      toast.success('Successfully synced with database');
      
      // Refresh custom URLs
      fetchCustomUrls();
      
      // Reset after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      setSyncStatus('error');
      
      // Handle Firebase-specific errors
      logFirebaseError('Sync with Firebase', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      
      // Reset after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleSaveCustomUrl = async () => {
    if (!newUrl) {
      toast.error('URL is required');
      return;
    }
    
    try {
      if (editingUrlId) {
        // Update existing URL using Firestore
        const urlRef = doc(db, 'custom_urls', editingUrlId);
        await updateDoc(urlRef, {
          url: newUrl,
          title: newUrlTitle,
          description: newUrlDescription,
          updated_at: new Date()
        });
        
        toast.success('URL updated successfully');
      } else {
        // Create new URL
        const urlId = await saveCustomUrl(newUrl, newUrlTitle, newUrlDescription);
        
        if (!urlId) {
          throw new Error('Failed to save custom URL');
        }
        
        toast.success('New URL added successfully');
      }
      
      // Reset form and close modal
      setNewUrl('');
      setNewUrlTitle('');
      setNewUrlDescription('');
      setEditingUrlId(null);
      setUrlModalOpen(false);
      
      // Refresh custom URLs list
      fetchCustomUrls();
    } catch (error) {
      logFirebaseError('Save Custom URL', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
    }
  };

  const handleEditUrl = (url) => {
    setNewUrl(url.url);
    setNewUrlTitle(url.title || '');
    setNewUrlDescription(url.description || '');
    setEditingUrlId(url.id);
    setUrlModalOpen(true);
  };

  const handleDeleteUrl = async (urlId) => {
    if (window.confirm('Are you sure you want to delete this URL? This may affect any audio mappings using it.')) {
      try {
        // First update any audio mappings using this URL
        const audioMappingsRef = collection(db, 'audio_mappings');
        const q = query(audioMappingsRef, where('custom_url_id', '==', urlId));
        const querySnapshot = await getDocs(q);
        
        // Use batch to update all affected audio mappings
        if (!querySnapshot.empty) {
          const batch = writeBatch(db);
          querySnapshot.forEach((docSnapshot) => {
            batch.update(docSnapshot.ref, { custom_url_id: null });
          });
          await batch.commit();
        }
        
        // Then delete the URL
        const urlRef = doc(db, 'custom_urls', urlId);
        await deleteDoc(urlRef);
        
        toast.success('URL deleted successfully');
        
        // Refresh custom URLs list
        fetchCustomUrls();
      } catch (error) {
        logFirebaseError('Delete Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
      }
    }
  };

  const filteredSurahs = surahs.filter(surah => 
    surah.name_simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.translated_name.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUrls = customUrls.filter(url => 
    url.url.toLowerCase().includes(urlsSearchTerm.toLowerCase()) ||
    (url.title && url.title.toLowerCase().includes(urlsSearchTerm.toLowerCase())) ||
    (url.description && url.description.toLowerCase().includes(urlsSearchTerm.toLowerCase()))
  );

  const getMappingsForSurah = (surahId, mappings) => {
    return Object.entries(mappings)
      .filter(([key]) => key.startsWith(`${surahId}:`))
      .map(([key, value]) => {
        const ayah = key.split(':')[1];
        
        // Handle both object and string formats
        if (typeof value === 'object') {
          return {
            ayah,
            value: value.url || value.customUrl || '',
            customUrl: value.customUrl || value.url || ''
          };
        }
        
        return {
          ayah,
          value
        };
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-50 to-islamic-100">
      <nav className="bg-white shadow-lg border-b border-islamic-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-islamic-800">Admin Panel</h1>
              {user && (
                <span className="ml-3 bg-islamic-100 text-islamic-600 px-3 py-1 rounded-full text-sm">
                  {user.email}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={syncWithFirebase}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  syncStatus === 'syncing' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : syncStatus === 'success'
                    ? 'bg-green-100 text-green-700'
                    : syncStatus === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-islamic-100 text-islamic-600 hover:bg-islamic-200'
                }`}
                disabled={syncStatus === 'syncing'}
              >
                <SafeIcon 
                  icon={
                    syncStatus === 'syncing' ? FiRefreshCw :
                    syncStatus === 'success' ? FiDatabase :
                    syncStatus === 'error' ? FiDatabase :
                    FiDatabase
                  } 
                  className={syncStatus === 'syncing' ? 'animate-spin' : ''}
                />
                <span>
                  {syncStatus === 'syncing' ? 'Syncing...' :
                   syncStatus === 'success' ? 'Synced!' :
                   syncStatus === 'error' ? 'Sync Failed' :
                   'Sync Database'}
                </span>
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiLogOut} />
                <span>Logout</span>
              </button>
            </div>
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
          <button
            onClick={() => setActiveTab('urls')}
            className={`py-3 px-6 font-medium ${
              activeTab === 'urls'
                ? 'text-islamic-gold border-b-2 border-islamic-gold'
                : 'text-islamic-600 hover:text-islamic-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiLink} />
              <span>Custom URLs</span>
            </div>
          </button>
        </div>

        {activeTab === 'urls' ? (
          <div className="grid grid-cols-1 gap-8">
            {/* Custom URLs Management */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="admin-panel p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiLink} className="text-islamic-gold text-2xl" />
                  <h2 className="text-xl font-bold text-islamic-800">Custom URLs</h2>
                </div>
                <button
                  onClick={() => {
                    setNewUrl('');
                    setNewUrlTitle('');
                    setNewUrlDescription('');
                    setEditingUrlId(null);
                    setUrlModalOpen(true);
                  }}
                  className="flex items-center space-x-2 bg-islamic-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiPlus} />
                  <span>Add New URL</span>
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-islamic-400" />
                  <input
                    type="text"
                    value={urlsSearchTerm}
                    onChange={(e) => setUrlsSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                    placeholder="Search URLs..."
                  />
                </div>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-islamic-200">
                  <thead className="bg-islamic-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-islamic-800 sm:pl-6">Title</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-islamic-800">URL</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-islamic-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-islamic-200 bg-white">
                    {filteredUrls.length > 0 ? (
                      filteredUrls.map((url) => (
                        <tr key={url.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-islamic-800">{url.title || 'Untitled'}</div>
                            {url.description && (
                              <div className="text-islamic-500 truncate max-w-xs">{url.description}</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="text-islamic-600 truncate max-w-xs">{url.url}</div>
                              <a 
                                href={url.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-islamic-gold hover:text-yellow-600"
                              >
                                <SafeIcon icon={FiExternalLink} />
                              </a>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleEditUrl(url)}
                                className="text-islamic-600 hover:text-islamic-800"
                              >
                                <SafeIcon icon={FiEdit} />
                              </button>
                              <button
                                onClick={() => handleDeleteUrl(url.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <SafeIcon icon={FiIcons.FiTrash2} />
                              </button>
                              <button
                                onClick={() => {
                                  const audio = new Audio(url.url);
                                  audio.play().catch(err => {
                                    console.error(err);
                                    toast.error('Failed to play audio');
                                  });
                                }}
                                className="text-islamic-600 hover:text-islamic-800"
                              >
                                <SafeIcon icon={FiPlay} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-4 text-center text-islamic-600">
                          No custom URLs found. Add your first one!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        ) : (
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
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-islamic-700 mb-2">
                        Select Existing Audio URL (Optional)
                      </label>
                      <select
                        value={selectedUrlId}
                        onChange={(e) => {
                          setSelectedUrlId(e.target.value);
                          // Clear direct URL input if a custom URL is selected
                          if (e.target.value) {
                            setAudioUrl('');
                          }
                        }}
                        className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                      >
                        <option value="">Choose a saved URL or enter a new one below</option>
                        {customUrls.map(url => (
                          <option key={url.id} value={url.id}>
                            {url.title || 'Untitled'} - {url.url}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-islamic-700 mb-2">
                        Or Enter New Audio URL
                      </label>
                      <input
                        type="url"
                        value={audioUrl}
                        onChange={(e) => {
                          setAudioUrl(e.target.value);
                          // Clear selected URL if direct URL is entered
                          if (e.target.value) {
                            setSelectedUrlId('');
                          }
                        }}
                        className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                        placeholder="https://everyayah.com/data/..."
                        disabled={!!selectedUrlId}
                      />
                      <p className="text-xs text-islamic-500 mt-1">
                        Default format: https://everyayah.com/data/Alafasy_128kbps/SSSAAA.mp3
                      </p>
                    </div>
                  </>
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
                          <div key={mapping.ayah} className="text-sm text-islamic-600 bg-islamic-50 p-2 rounded flex items-center justify-between">
                            <div>
                              <span className="font-medium">Ayah {mapping.ayah}:</span> {activeTab === 'audio' 
                                ? (
                                  mapping.customUrl 
                                    ? <span className="text-islamic-gold">Custom audio URL assigned</span> 
                                    : 'Default audio'
                                )
                                : `${mapping.value.substring(0, 50)}${mapping.value.length > 50 ? '...' : ''}`
                              }
                            </div>
                            
                            {activeTab === 'audio' && mapping.customUrl && (
                              <div className="flex items-center space-x-2">
                                <a 
                                  href={mapping.customUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-islamic-gold hover:text-yellow-600"
                                  title="Open audio URL"
                                >
                                  <SafeIcon icon={FiExternalLink} />
                                </a>
                                <button
                                  onClick={() => {
                                    const audio = new Audio(mapping.customUrl);
                                    audio.play().catch(err => {
                                      console.error(err);
                                      toast.error('Failed to play audio');
                                    });
                                  }}
                                  className="text-islamic-600 hover:text-islamic-800"
                                  title="Play audio"
                                >
                                  <SafeIcon icon={FiPlay} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="admin-panel p-6 mt-8"
        >
          <h2 className="text-xl font-bold text-islamic-800 mb-6">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-islamic-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-islamic-gold">{stats.totalSurahs}</div>
              <div className="text-islamic-600">Total Surahs</div>
            </div>
            <div className="bg-islamic-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-islamic-gold">
                {stats.audioCount}
              </div>
              <div className="text-islamic-600">Audio Mappings</div>
            </div>
            <div className="bg-islamic-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-islamic-gold">
                {stats.tafseerCount}
              </div>
              <div className="text-islamic-600">Tafseer Entries</div>
            </div>
            <div className="bg-islamic-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-islamic-gold">
                {stats.urlsCount}
              </div>
              <div className="text-islamic-600">Custom URLs</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom URL Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-islamic-800">
                  {editingUrlId ? 'Edit Custom URL' : 'Add New Custom URL'}
                </h3>
                <button
                  onClick={() => setUrlModalOpen(false)}
                  className="text-islamic-500 hover:text-islamic-700"
                >
                  <SafeIcon icon={FiIcons.FiX} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-islamic-700 mb-2">
                    Audio URL *
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                    placeholder="https://example.com/audio.mp3"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-islamic-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={newUrlTitle}
                    onChange={(e) => setNewUrlTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                    placeholder="Give this audio URL a title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-islamic-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newUrlDescription}
                    onChange={(e) => setNewUrlDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none"
                    placeholder="Add additional details about this audio URL"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setUrlModalOpen(false)}
                    className="flex-1 py-2 border border-islamic-200 rounded-lg text-islamic-700 hover:bg-islamic-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCustomUrl}
                    className="flex-1 py-2 bg-islamic-gold hover:bg-yellow-600 text-white rounded-lg"
                  >
                    {editingUrlId ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;