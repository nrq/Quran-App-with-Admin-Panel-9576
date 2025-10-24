import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { handleFirebaseError, logFirebaseError } from '../utils/firebaseErrorHandler';
import { useAuth } from './AuthContext';

const QuranContext = createContext();

export const useQuran = () => {
  const context = useContext(QuranContext);
  if (!context) {
    throw new Error('useQuran must be used within a QuranProvider');
  }
  return context;
};

export const QuranProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
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
  const audioRef = useRef(null);
  const savePositionTimeoutRef = useRef(null);

  // Load Quran chapters list from offline data
  useEffect(() => {
    const loadSurahs = async () => {
      try {
        console.log('Loading surahs from offline data...');
        // Import offline surah data
        const { getAllSurahsInfo } = await import('../data/quran-data.js');
        const surahsData = getAllSurahsInfo();
        console.log('Loaded surahs:', surahsData.length);
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

  // Load audio, tafseer mappings and custom URLs from Firestore
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        // Fetch custom URLs from Firestore
        const customUrlsRef = collection(db, 'custom_urls');
        const urlsSnapshot = await getDocs(customUrlsRef);
        const urlsData = urlsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomUrls(urlsData);
        
        // Fetch audio mappings from Firestore
        const audioMappingsRef = collection(db, 'audio_mappings');
        const audioSnapshot = await getDocs(audioMappingsRef);
        
        // Convert to key-value mapping format
        const audioMap = {};
        for (const doc of audioSnapshot.docs) {
          const mapping = doc.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          
          // Fetch related custom URL if exists
          let customUrl = null;
          if (mapping.custom_url_id) {
            const relatedUrl = urlsData.find(url => url.id === mapping.custom_url_id);
            customUrl = relatedUrl ? relatedUrl.url : null;
          }
          
          audioMap[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl: customUrl
          };
        }
        setAudioMappings(audioMap);
        
        // Fetch tafseer mappings from Firestore
        const tafseerEntriesRef = collection(db, 'tafseer_entries');
        const tafseerSnapshot = await getDocs(tafseerEntriesRef);
        
        // Convert to key-value mapping format
        const tafseerMap = {};
        tafseerSnapshot.docs.forEach(doc => {
          const mapping = doc.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          tafseerMap[key] = mapping.tafseer_text;
        });
        setTafseerMappings(tafseerMap);
      } catch (error) {
        // Only log and show errors that are not permission-denied
        if (error.code !== 'permission-denied') {
          logFirebaseError('Fetch Mappings', error);
          const errorMessage = handleFirebaseError(error);
          toast.error(errorMessage);
        }
        
        // Fallback to localStorage if Firestore fails
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

  // Set up real-time subscription for updates with Firestore
  useEffect(() => {
    // Subscribe to audio mappings changes
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
        // Silently handle permission errors for unauthenticated users
        if (error.code !== 'permission-denied') {
          logFirebaseError('Audio Mappings Listener', error);
        }
      }
    );
    
    // Subscribe to tafseer entries changes
    const tafseerEntriesRef = collection(db, 'tafseer_entries');
    const unsubscribeTafseer = onSnapshot(
      tafseerEntriesRef, 
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const key = `${data.surah_number}:${data.ayah_number}`;
            setTafseerMappings(prev => ({ ...prev, [key]: data.tafseer_text }));
          }
        });
      },
      (error) => {
        // Silently handle permission errors for unauthenticated users
        if (error.code !== 'permission-denied') {
          logFirebaseError('Tafseer Entries Listener', error);
        }
      }
    );
    
    // Subscribe to custom URLs changes
    const customUrlsRef = collection(db, 'custom_urls');
    const unsubscribeUrls = onSnapshot(
      customUrlsRef, 
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            // Refresh custom URLs list
            fetchCustomUrls();
            // Update any audio mappings that might use this URL
            updateAudioMappingsWithUrl(change.doc.id);
          }
        });
      },
      (error) => {
        // Silently handle permission errors for unauthenticated users
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
  }, []);

  // Fetch a single updated audio mapping
  const fetchUpdatedAudioMapping = async (surahNumber, ayahNumber) => {
    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(
        audioMappingsRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        
        // Fetch related custom URL if exists
        let customUrl = null;
        if (data.custom_url_id) {
          const customUrlsRef = collection(db, 'custom_urls');
          const urlsSnapshot = await getDocs(customUrlsRef);
          const relatedUrl = urlsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .find(url => url.id === data.custom_url_id);
          customUrl = relatedUrl ? relatedUrl.url : null;
        }
        
        const key = `${surahNumber}:${ayahNumber}`;
        setAudioMappings(prev => ({
          ...prev, 
          [key]: {
            url: data.audio_url,
            customUrlId: data.custom_url_id,
            customUrl: customUrl
          }
        }));
      }
    } catch (error) {
      logFirebaseError('Fetch Updated Audio Mapping', error);
    }
  };

  // Fetch all custom URLs
  const fetchCustomUrls = async () => {
    try {
      const customUrlsRef = collection(db, 'custom_urls');
      const querySnapshot = await getDocs(customUrlsRef);
      const urlsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCustomUrls(urlsData);
    } catch (error) {
      logFirebaseError('Fetch Custom URLs', error);
    }
  };

  // Update audio mappings when a custom URL changes
  const updateAudioMappingsWithUrl = async (urlId) => {
    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(audioMappingsRef, where('custom_url_id', '==', urlId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Fetch the custom URL
        const customUrlsRef = collection(db, 'custom_urls');
        const urlsSnapshot = await getDocs(customUrlsRef);
        const customUrl = urlsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .find(url => url.id === urlId);
        
        const updatedMappings = { ...audioMappings };
        
        querySnapshot.docs.forEach(doc => {
          const mapping = doc.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          updatedMappings[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl: customUrl ? customUrl.url : null
          };
        });
        
        setAudioMappings(updatedMappings);
      }
    } catch (error) {
      logFirebaseError('Update Audio Mappings with URL', error);
    }
  };

  // Create a new custom URL
  const createCustomUrl = async (url, title = '', description = '') => {
    try {
      const customUrlsRef = collection(db, 'custom_urls');
      const docRef = await addDoc(customUrlsRef, { 
        url, 
        title, 
        description,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      // Refresh custom URLs list
      await fetchCustomUrls();
      
      toast.success('Custom URL created successfully');
      return docRef.id;
    } catch (error) {
      logFirebaseError('Create Custom URL', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return null;
    }
  };

  // Update an existing custom URL by ID
  const updateCustomUrl = async (urlId, updates) => {
    try {
      const docRef = doc(db, 'custom_urls', urlId);
      await updateDoc(docRef, { 
        ...updates,
        updated_at: serverTimestamp()
      });
      
      // Refresh custom URLs list
      await fetchCustomUrls();
      
      toast.success('Custom URL updated successfully');
      return true;
    } catch (error) {
      logFirebaseError('Update Custom URL', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  };

  // Delete a custom URL by ID
  const deleteCustomUrl = async (urlId) => {
    try {
      // Check if this URL is being used by any audio mappings
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(audioMappingsRef, where('custom_url_id', '==', urlId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error('Cannot delete URL: it is being used by audio mappings');
        return false;
      }
      
      const docRef = doc(db, 'custom_urls', urlId);
      await deleteDoc(docRef);
      
      // Refresh custom URLs list
      await fetchCustomUrls();
      
      toast.success('Custom URL deleted successfully');
      return true;
    } catch (error) {
      logFirebaseError('Delete Custom URL', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  };

  // Upsert a custom URL (create if doesn't exist, update if exists)
  // This checks by URL string to avoid duplicates
  const saveCustomUrl = async (url, title = '', description = '') => {
    try {
      // Check if URL already exists
      const customUrlsRef = collection(db, 'custom_urls');
      const q = query(customUrlsRef, where('url', '==', url));
      const querySnapshot = await getDocs(q);
      
      let urlId;
      
      if (!querySnapshot.empty) {
        // Update existing URL
        const existingDoc = querySnapshot.docs[0];
        urlId = existingDoc.id;
        await updateCustomUrl(urlId, { title, description });
      } else {
        // Create new URL
        urlId = await createCustomUrl(url, title, description);
      }
      
      return urlId;
    } catch (error) {
      logFirebaseError('Save Custom URL', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return null;
    }
  };

  // Get a custom URL by ID
  const getCustomUrlById = (urlId) => {
    try {
      const customUrl = customUrls.find(url => url.id === urlId);
      return customUrl || null;
    } catch (error) {
      console.error('Error getting custom URL:', error);
      return null;
    }
  };

  const saveAudioMapping = async (surahNumber, ayahNumber, audioUrl, customUrlTitle = '') => {
    const key = `${surahNumber}:${ayahNumber}`;
    
    try {
      // First save or get the custom URL
      let customUrlId = null;
      
      if (audioUrl) {
        customUrlId = await saveCustomUrl(audioUrl, customUrlTitle || `Audio for ${surahNumber}:${ayahNumber}`);
      }
      
      // Check if audio mapping already exists
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(
        audioMappingsRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Update existing mapping
        const existingDoc = querySnapshot.docs[0];
        const docRef = doc(db, 'audio_mappings', existingDoc.id);
        await updateDoc(docRef, { 
          audio_url: audioUrl,
          custom_url_id: customUrlId,
          updated_at: serverTimestamp()
        });
      } else {
        // Create new mapping
        await addDoc(audioMappingsRef, { 
          surah_number: surahNumber, 
          ayah_number: ayahNumber, 
          audio_url: audioUrl,
          custom_url_id: customUrlId,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
      
      // Update local state
      const newMappings = { 
        ...audioMappings, 
        [key]: {
          url: audioUrl,
          customUrlId,
          customUrl: audioUrl
        }
      };
      setAudioMappings(newMappings);
      
      // Backup to localStorage
      localStorage.setItem('quran_audio_mappings', JSON.stringify(newMappings));
      
      toast.success('Audio mapping saved successfully');
      return true;
    } catch (error) {
      logFirebaseError('Save Audio Mapping', error);
      const errorMessage = handleFirebaseError(error);
      
      // Fallback to localStorage only if Firestore fails
      const newMappings = { 
        ...audioMappings, 
        [key]: {
          url: audioUrl,
          customUrl: audioUrl
        }
      };
      setAudioMappings(newMappings);
      localStorage.setItem('quran_audio_mappings', JSON.stringify(newMappings));
      
      toast.error(`${errorMessage} - Saved locally instead.`);
      return false;
    }
  };

  // Delete an audio mapping
  const deleteAudioMapping = async (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    
    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(
        audioMappingsRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'audio_mappings', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
        
        // Update local state
        const newMappings = { ...audioMappings };
        delete newMappings[key];
        setAudioMappings(newMappings);
        
        // Update localStorage
        localStorage.setItem('quran_audio_mappings', JSON.stringify(newMappings));
        
        toast.success('Audio mapping deleted successfully');
        return true;
      }
    } catch (error) {
      logFirebaseError('Delete Audio Mapping', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  };

  const saveTafseerMapping = async (surahNumber, ayahNumber, tafseerText) => {
    const key = `${surahNumber}:${ayahNumber}`;
    
    try {
      // Check if tafseer entry already exists
      const tafseerEntriesRef = collection(db, 'tafseer_entries');
      const q = query(
        tafseerEntriesRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Update existing entry
        const existingDoc = querySnapshot.docs[0];
        const docRef = doc(db, 'tafseer_entries', existingDoc.id);
        await updateDoc(docRef, { 
          tafseer_text: tafseerText,
          updated_at: serverTimestamp()
        });
      } else {
        // Create new entry
        await addDoc(tafseerEntriesRef, { 
          surah_number: surahNumber, 
          ayah_number: ayahNumber, 
          tafseer_text: tafseerText,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
      
      // Update local state
      const newMappings = { ...tafseerMappings, [key]: tafseerText };
      setTafseerMappings(newMappings);
      
      // Backup to localStorage
      localStorage.setItem('quran_tafseer_mappings', JSON.stringify(newMappings));
      
      toast.success('Tafseer saved successfully');
    } catch (error) {
      logFirebaseError('Save Tafseer', error);
      const errorMessage = handleFirebaseError(error);
      
      // Fallback to localStorage only if Firestore fails
      const newMappings = { ...tafseerMappings, [key]: tafseerText };
      setTafseerMappings(newMappings);
      localStorage.setItem('quran_tafseer_mappings', JSON.stringify(newMappings));
      
      toast.error(`${errorMessage} - Saved locally instead.`);
    }
  };

  // Delete a tafseer entry
  const deleteTafseerMapping = async (surahNumber, ayahNumber) => {
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
        const docRef = doc(db, 'tafseer_entries', querySnapshot.docs[0].id);
        await deleteDoc(docRef);
        
        // Update local state
        const newMappings = { ...tafseerMappings };
        delete newMappings[key];
        setTafseerMappings(newMappings);
        
        // Update localStorage
        localStorage.setItem('quran_tafseer_mappings', JSON.stringify(newMappings));
        
        toast.success('Tafseer deleted successfully');
        return true;
      }
    } catch (error) {
      logFirebaseError('Delete Tafseer', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  };

  const getAudioUrl = (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    const mapping = audioMappings[key];
    
    // If we have a custom URL stored in Supabase, use that
    if (mapping && mapping.customUrl) {
      return mapping.customUrl;
    }
    
    // If we have a direct URL stored, use that
    if (mapping && mapping.url) {
      return mapping.url;
    }
    
    // Fall back to the default URL pattern
    return `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`;
  };

  const getTafseer = (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    return tafseerMappings[key] || '';
  };

  // Save reading position to localStorage
  const saveReadingPosition = (surahNumber, ayahNumber, scrollPosition, isPausedState) => {
    try {
      const position = {
        surahNumber,
        ayahNumber,
        scrollPosition,
        timestamp: Date.now(),
        isPaused: isPausedState
      };
      localStorage.setItem('quran_reading_position', JSON.stringify(position));
    } catch (error) {
      // Handle localStorage errors
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        // Clear old position and try again
        try {
          localStorage.removeItem('quran_reading_position');
          const position = {
            surahNumber,
            ayahNumber,
            scrollPosition,
            timestamp: Date.now(),
            isPaused: isPausedState
          };
          localStorage.setItem('quran_reading_position', JSON.stringify(position));
        } catch (retryError) {
          console.error('Failed to save position after clearing:', retryError);
        }
      } else {
        console.error('Error saving reading position:', error);
      }
    }
  };

  // Auto-save position when playingAyah or isPaused changes (with debouncing)
  useEffect(() => {
    if (playingAyah) {
      // Clear any existing timeout
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }

      // Set a new timeout to save after 500ms
      savePositionTimeoutRef.current = setTimeout(() => {
        try {
          // Extract surah and ayah numbers from playingAyah string
          const [surahNumber, ayahNumber] = playingAyah.split(':').map(Number);
          
          // Capture current scroll position
          const scrollPosition = window.scrollY;
          
          // Save position
          saveReadingPosition(surahNumber, ayahNumber, scrollPosition, isPaused);
        } catch (error) {
          console.error('Error auto-saving position:', error);
        }
      }, 500);
    }

    // Cleanup timeout on unmount
    return () => {
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }
    };
  }, [playingAyah, isPaused]);

  // Restore position on mount
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem('quran_reading_position');
      
      if (savedPosition) {
        const position = JSON.parse(savedPosition);
        
        // Validate the position data
        if (position.surahNumber && position.ayahNumber) {
          setLastPlayedPosition(position);
          
          // Optionally restore scroll position after a short delay
          // to ensure the page has rendered
          if (position.scrollPosition !== undefined) {
            setTimeout(() => {
              window.scrollTo(0, position.scrollPosition);
            }, 100);
          }

          // Show toast notification with surah name and ayah number
          // Wait for surahs to be loaded before showing notification
          const showNotification = () => {
            if (surahs.length > 0) {
              const surah = surahs.find(s => s.id === position.surahNumber);
              if (surah) {
                toast.success(
                  `Continue from where you left off: ${surah.name_simple} (${surah.name_arabic}), Ayah ${position.ayahNumber}`,
                  { duration: 4000 }
                );
              }
            } else {
              // If surahs not loaded yet, try again after a short delay
              setTimeout(showNotification, 500);
            }
          };
          
          // Show notification after a brief delay to avoid overwhelming the user
          setTimeout(showNotification, 1000);
        }
      }
    } catch (error) {
      console.error('Error restoring reading position:', error);
      // Clear corrupted data
      localStorage.removeItem('quran_reading_position');
    }
  }, []); // Empty dependency array - run once on mount

  const pauseAudio = () => {
    console.log(`🎵 [QuranContext] pauseAudio called`);
    
    if (audioRef.current && playingAyah && !isPaused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    console.log(`🎵 [QuranContext] resumeAudio called`);
    
    if (audioRef.current && playingAyah && isPaused) {
      audioRef.current.play()
        .then(() => {
          setIsPaused(false);
        })
        .catch((error) => {
          console.error('Error resuming audio:', error);
          toast.error('Failed to resume audio');
        });
    }
  };

  const playAudio = (surahNumber, ayahNumber, autoPlayNext = true) => {
    console.log(`🎵 [QuranContext] playAudio called for ${surahNumber}:${ayahNumber}`);
    
    // If same ayah is playing, check pause state
    const ayahKey = `${surahNumber}:${ayahNumber}`;
    if (audioRef.current && playingAyah === ayahKey) {
      console.log(`🎵 [QuranContext] Same ayah playing, toggling state`);
      if (isPaused) {
        // Resume from paused state
        resumeAudio();
      } else {
        // Pause the currently playing audio
        pauseAudio();
      }
      return;
    }

    // If there's already audio playing, stop it
    if (audioRef.current) {
      console.log(`🎵 [QuranContext] Stopping previous audio`);
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Get the audio URL
    const audioUrl = getAudioUrl(surahNumber, ayahNumber);
    console.log(`🎵 [QuranContext] Audio URL: ${audioUrl}`);
    
    // Create a new audio element
    const audio = new Audio(audioUrl);
    
    // Set the audio reference
    audioRef.current = audio;
    
    // Show loading toast
    const loadingToastId = toast.loading('Loading audio...');
    
    // Add event listeners
    audio.addEventListener('canplay', () => {
      console.log(`🎵 [QuranContext] Audio can play`);
      toast.dismiss(loadingToastId);
      audio.play()
        .then(() => {
          console.log(`🎵 [QuranContext] Audio started playing`);
          
          // Set state - scroll lock should handle position
          setPlayingAyah(ayahKey);
          setCurrentAudio(audio);
          setIsPaused(false);
        })
        .catch((error) => {
          console.error('Error playing audio:', error);
          toast.error('Failed to play audio');
          setPlayingAyah(null);
        });
    });
    
    audio.addEventListener('ended', () => {
      console.log(`🎵 [QuranContext] Audio ended`);
      
      // Lock scroll position for auto-play transition
      const scrollBeforeEnd = window.scrollY;
      if (window.lockScroll) {
        window.lockScroll(scrollBeforeEnd);
      }
      
      setPlayingAyah(null);
      setCurrentAudio(null);
      setIsPaused(false);
      
      // Auto-play next ayah if enabled
      if (autoPlayNext) {
        const currentSurahData = surahs.find(s => s.id === surahNumber);
        if (currentSurahData && ayahNumber < currentSurahData.verses_count) {
          // Play next ayah after a short delay
          setTimeout(() => {
            playAudio(surahNumber, ayahNumber + 1, true);
          }, 500);
        }
      }
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      toast.dismiss(loadingToastId);
      toast.error('Failed to load audio. Please try another ayah.');
      setPlayingAyah(null);
    });
    
    // Start loading the audio
    console.log(`🎵 [QuranContext] Starting audio load`);
    audio.load();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setCurrentAudio(null);
      setPlayingAyah(null);
      setIsPaused(false);
    }
  };

  const fetchSurahVerses = async (surahNumber) => {
    try {
      console.log('Loading verses for surah:', surahNumber);
      // Import offline verse data
      const { getSurahVerses } = await import('../data/quran-data.js');
      const verses = await getSurahVerses(surahNumber);
      console.log('Loaded verses:', verses.length);
      return verses;
    } catch (error) {
      console.error('Error loading offline verses:', error);
      toast.error('Failed to load verses');
      return [];
    }
  };

  const value = {
    surahs,
    loading,
    currentAudio,
    playingAyah,
    audioMappings,
    tafseerMappings,
    customUrls,
    currentSurah,
    isPaused,
    lastPlayedPosition,
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
    getTafseer,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    fetchSurahVerses,
    fetchCustomUrls
  };

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
};