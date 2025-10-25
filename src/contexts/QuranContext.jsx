import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { handleFirebaseError, logFirebaseError } from '../utils/firebaseErrorHandler';

const QuranDataContext = createContext(null);
const QuranAudioContext = createContext(null);

export const useQuranData = () => {
  const context = useContext(QuranDataContext);
  if (!context) {
    throw new Error('useQuranData must be used within a QuranProvider');
  }
  return context;
};

export const useQuranAudio = () => {
  const context = useContext(QuranAudioContext);
  if (!context) {
    throw new Error('useQuranAudio must be used within a QuranProvider');
  }
  return context;
};

export const useQuran = () => {
  const data = useQuranData();
  const audio = useQuranAudio();
  return useMemo(() => ({ ...data, ...audio }), [data, audio]);
};

export const QuranProvider = ({ children }) => {
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

  const fetchCustomUrls = useCallback(async () => {
    try {
      const customUrlsRef = collection(db, 'custom_urls');
      const querySnapshot = await getDocs(customUrlsRef);
      const urlsData = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      setCustomUrls(urlsData);
    } catch (error) {
      logFirebaseError('Fetch Custom URLs', error);
    }
  }, []);

  const fetchUpdatedAudioMapping = useCallback(async (surahNumber, ayahNumber) => {
    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(
        audioMappingsRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const data = querySnapshot.docs[0].data();

      let customUrl = null;
      if (data.custom_url_id) {
        const customUrlsRef = collection(db, 'custom_urls');
        const urlsSnapshot = await getDocs(customUrlsRef);
        const match = urlsSnapshot.docs
          .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
          .find((url) => url.id === data.custom_url_id);
        customUrl = match ? match.url : null;
      }

      const key = `${surahNumber}:${ayahNumber}`;
      setAudioMappings((prev) => ({
        ...prev,
        [key]: {
          url: data.audio_url,
          customUrlId: data.custom_url_id,
          customUrl
        }
      }));
    } catch (error) {
      logFirebaseError('Fetch Updated Audio Mapping', error);
    }
  }, []);

  const updateAudioMappingsWithUrl = useCallback(async (urlId) => {
    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(audioMappingsRef, where('custom_url_id', '==', urlId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const customUrlsRef = collection(db, 'custom_urls');
      const urlsSnapshot = await getDocs(customUrlsRef);
      const matchedUrl = urlsSnapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
        .find((url) => url.id === urlId);

      setAudioMappings((prev) => {
        const next = { ...prev };
        querySnapshot.docs.forEach((docSnapshot) => {
          const mapping = docSnapshot.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          next[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl: matchedUrl ? matchedUrl.url : null
          };
        });
        localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
        return next;
      });
    } catch (error) {
      logFirebaseError('Update Audio Mappings with URL', error);
    }
  }, []);

  const createCustomUrl = useCallback(
    async (url, title = '', description = '') => {
      try {
        const customUrlsRef = collection(db, 'custom_urls');
        const docRef = await addDoc(customUrlsRef, {
          url,
          title,
          description,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        await fetchCustomUrls();
        toast.success('Custom URL created successfully');
        return docRef.id;
      } catch (error) {
        logFirebaseError('Create Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return null;
      }
    },
    [fetchCustomUrls]
  );

  const updateCustomUrl = useCallback(
    async (urlId, updates) => {
      try {
        const docRef = doc(db, 'custom_urls', urlId);
        await updateDoc(docRef, {
          ...updates,
          updated_at: serverTimestamp()
        });

        await fetchCustomUrls();
        toast.success('Custom URL updated successfully');
        return true;
      } catch (error) {
        logFirebaseError('Update Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchCustomUrls]
  );

  const deleteCustomUrl = useCallback(
    async (urlId) => {
      try {
        const audioMappingsRef = collection(db, 'audio_mappings');
        const q = query(audioMappingsRef, where('custom_url_id', '==', urlId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          toast.error('Cannot delete URL: it is being used by audio mappings');
          return false;
        }

        const docRef = doc(db, 'custom_urls', urlId);
        await deleteDoc(docRef);
        await fetchCustomUrls();

        toast.success('Custom URL deleted successfully');
        return true;
      } catch (error) {
        logFirebaseError('Delete Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchCustomUrls]
  );

  const saveCustomUrl = useCallback(
    async (url, title = '', description = '') => {
      try {
        const customUrlsRef = collection(db, 'custom_urls');
        const q = query(customUrlsRef, where('url', '==', url));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          await updateCustomUrl(existingDoc.id, { title, description });
          return existingDoc.id;
        }

        return await createCustomUrl(url, title, description);
      } catch (error) {
        logFirebaseError('Save Custom URL', error);
        const errorMessage = handleFirebaseError(error);
        toast.error(errorMessage);
        return null;
      }
    },
    [createCustomUrl, updateCustomUrl]
  );

  const getCustomUrlById = useCallback(
    (urlId) => customUrls.find((url) => url.id === urlId) || null,
    [customUrls]
  );

  const saveAudioMapping = useCallback(
    async (surahNumber, ayahNumber, audioUrl, customUrlTitle = '') => {
      const key = `${surahNumber}:${ayahNumber}`;

      try {
        let customUrlId = null;
        if (audioUrl) {
          customUrlId = await saveCustomUrl(
            audioUrl,
            customUrlTitle || `Audio for ${surahNumber}:${ayahNumber}`
          );
        }

        const audioMappingsRef = collection(db, 'audio_mappings');
        const q = query(
          audioMappingsRef,
          where('surah_number', '==', surahNumber),
          where('ayah_number', '==', ayahNumber)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          const docRef = doc(db, 'audio_mappings', existingDoc.id);
          await updateDoc(docRef, {
            audio_url: audioUrl,
            custom_url_id: customUrlId,
            updated_at: serverTimestamp()
          });
        } else {
          await addDoc(audioMappingsRef, {
            surah_number: surahNumber,
            ayah_number: ayahNumber,
            audio_url: audioUrl,
            custom_url_id: customUrlId,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }

        setAudioMappings((prev) => {
          const next = {
            ...prev,
            [key]: {
              url: audioUrl,
              customUrlId,
              customUrl: audioUrl
            }
          };
          localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
          return next;
        });

        toast.success('Audio mapping saved successfully');
        return true;
      } catch (error) {
        logFirebaseError('Save Audio Mapping', error);
        const errorMessage = handleFirebaseError(error);

        setAudioMappings((prev) => {
          const next = {
            ...prev,
            [key]: {
              url: audioUrl,
              customUrl: audioUrl
            }
          };
          localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
          return next;
        });

        toast.error(`${errorMessage} - Saved locally instead.`);
        return false;
      }
    },
    [saveCustomUrl]
  );

  const deleteAudioMapping = useCallback(async (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;

    try {
      const audioMappingsRef = collection(db, 'audio_mappings');
      const q = query(
        audioMappingsRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      const docRef = doc(db, 'audio_mappings', querySnapshot.docs[0].id);
      await deleteDoc(docRef);

      setAudioMappings((prev) => {
        const next = { ...prev };
        delete next[key];
        localStorage.setItem('quran_audio_mappings', JSON.stringify(next));
        return next;
      });

      toast.success('Audio mapping deleted successfully');
      return true;
    } catch (error) {
      logFirebaseError('Delete Audio Mapping', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const saveTafseerMapping = useCallback(async (surahNumber, ayahNumber, tafseerText) => {
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
        const existingDoc = querySnapshot.docs[0];
        const docRef = doc(db, 'tafseer_entries', existingDoc.id);
        await updateDoc(docRef, {
          tafseer_text: tafseerText,
          updated_at: serverTimestamp()
        });
      } else {
        await addDoc(tafseerEntriesRef, {
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          tafseer_text: tafseerText,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }

      setTafseerMappings((prev) => {
        const next = { ...prev, [key]: tafseerText };
        localStorage.setItem('quran_tafseer_mappings', JSON.stringify(next));
        return next;
      });

      toast.success('Tafseer saved successfully');
    } catch (error) {
      logFirebaseError('Save Tafseer', error);
      const errorMessage = handleFirebaseError(error);

      setTafseerMappings((prev) => {
        const next = { ...prev, [key]: tafseerText };
        localStorage.setItem('quran_tafseer_mappings', JSON.stringify(next));
        return next;
      });

      toast.error(`${errorMessage} - Saved locally instead.`);
    }
  }, []);

  const deleteTafseerMapping = useCallback(async (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;

    try {
      const tafseerEntriesRef = collection(db, 'tafseer_entries');
      const q = query(
        tafseerEntriesRef,
        where('surah_number', '==', surahNumber),
        where('ayah_number', '==', ayahNumber)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      const docRef = doc(db, 'tafseer_entries', querySnapshot.docs[0].id);
      await deleteDoc(docRef);

      setTafseerMappings((prev) => {
        const next = { ...prev };
        delete next[key];
        localStorage.setItem('quran_tafseer_mappings', JSON.stringify(next));
        return next;
      });

      toast.success('Tafseer deleted successfully');
      return true;
    } catch (error) {
      logFirebaseError('Delete Tafseer', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const getAudioUrl = useCallback((surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    const mapping = audioMappings[key];

    if (mapping?.customUrl) {
      return mapping.customUrl;
    }

    if (mapping?.url) {
      return mapping.url;
    }

    return `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`;
  }, [audioMappings]);

  const getTafseer = useCallback((surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    return tafseerMappings[key] || '';
  }, [tafseerMappings]);

  const pauseAudio = useCallback(() => {
    if (!audioRef.current || audioRef.current.paused) {
      return;
    }
    audioRef.current.pause();
  }, []);

  const resumeAudio = useCallback(() => {
    if (!audioRef.current || !audioRef.current.paused) {
      return;
    }
    const playPromise = audioRef.current.play();
    if (playPromise) {
      playPromise.catch((error) => {
        console.error('Audio resume error:', error);
        toast.error('Unable to resume audio playback.');
      });
    }
  }, []);

  const destroyCurrentAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audioRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    destroyCurrentAudio();
    setCurrentAudio(null);
    setPlayingAyah(null);
    setIsPaused(false);
  }, [destroyCurrentAudio]);

  const playAudio = useCallback(
    (surahNumber, ayahNumber, autoPlayNext = true) => {
      const ayahKey = `${surahNumber}:${ayahNumber}`;

      if (audioRef.current && playingAyah === ayahKey) {
        if (audioRef.current.paused) {
          resumeAudio();
        } else {
          pauseAudio();
        }
        return;
      }

      destroyCurrentAudio();

      const audioUrl = getAudioUrl(surahNumber, ayahNumber);
      const loadingToastId = toast.loading('Loading audio...');

      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';

      const handlePlaying = () => {
        toast.dismiss(loadingToastId);
        setPlayingAyah(ayahKey);
        setIsPaused(false);
      };

      const handlePause = () => {
        if (audio.paused) {
          setIsPaused(true);
        }
      };

      const handleError = (event) => {
        console.error('Audio playback error:', event);
        toast.dismiss(loadingToastId);
        toast.error('Failed to play audio. Please try another ayah.');
        setPlayingAyah(null);
        setIsPaused(false);
        setCurrentAudio(null);
        destroyCurrentAudio();
      };

      const handleEnded = () => {
        setPlayingAyah(null);
        setCurrentAudio(null);
        setIsPaused(false);
        destroyCurrentAudio();

        if (!autoPlayNext) {
          return;
        }

        const currentSurahData = surahs.find((surah) => surah.id === surahNumber);
        if (!currentSurahData || ayahNumber >= currentSurahData.verses_count) {
          return;
        }

        setTimeout(() => {
          playAudio(surahNumber, ayahNumber + 1, true);
        }, 500);
      };

      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('stalled', handleError);

      audioRef.current = audio;
      setCurrentAudio(audio);

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          console.error('Audio play promise rejected:', error);
          toast.dismiss(loadingToastId);
          toast.error('Playback was interrupted. Please try again.');
          setPlayingAyah(null);
          setIsPaused(false);
          setCurrentAudio(null);
          destroyCurrentAudio();
        });
      }
    },
    [destroyCurrentAudio, getAudioUrl, pauseAudio, playingAyah, resumeAudio, surahs]
  );

  const fetchSurahVerses = useCallback(async (surahNumber) => {
    try {
      const { getSurahVerses } = await import('../data/quran-data.js');
      return await getSurahVerses(surahNumber);
    } catch (error) {
      console.error('Error loading offline verses:', error);
      toast.error('Failed to load verses');
      return [];
    }
  }, []);

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const { getAllSurahsInfo } = await import('../data/quran-data.js');
        const surahsData = getAllSurahsInfo();
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

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const customUrlsRef = collection(db, 'custom_urls');
        const urlsSnapshot = await getDocs(customUrlsRef);
        const urlsData = urlsSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data()
        }));
        setCustomUrls(urlsData);

        const audioMappingsRef = collection(db, 'audio_mappings');
        const audioSnapshot = await getDocs(audioMappingsRef);
        const audioMap = {};
        for (const docSnapshot of audioSnapshot.docs) {
          const mapping = docSnapshot.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;

          let customUrl = null;
          if (mapping.custom_url_id) {
            const relatedUrl = urlsData.find((url) => url.id === mapping.custom_url_id);
            customUrl = relatedUrl ? relatedUrl.url : null;
          }

          audioMap[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl
          };
        }
        setAudioMappings(audioMap);

        const tafseerEntriesRef = collection(db, 'tafseer_entries');
        const tafseerSnapshot = await getDocs(tafseerEntriesRef);
        const tafseerMap = {};
        tafseerSnapshot.docs.forEach((docSnapshot) => {
          const mapping = docSnapshot.data();
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          tafseerMap[key] = mapping.tafseer_text;
        });
        setTafseerMappings(tafseerMap);
      } catch (error) {
        if (error.code !== 'permission-denied') {
          logFirebaseError('Fetch Mappings', error);
          const errorMessage = handleFirebaseError(error);
          toast.error(errorMessage);
        }

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

  useEffect(() => {
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
        if (error.code !== 'permission-denied') {
          logFirebaseError('Audio Mappings Listener', error);
        }
      }
    );

    const tafseerEntriesRef = collection(db, 'tafseer_entries');
    const unsubscribeTafseer = onSnapshot(
      tafseerEntriesRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const key = `${data.surah_number}:${data.ayah_number}`;
            setTafseerMappings((prev) => ({ ...prev, [key]: data.tafseer_text }));
          }
        });
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          logFirebaseError('Tafseer Entries Listener', error);
        }
      }
    );

    const customUrlsRef = collection(db, 'custom_urls');
    const unsubscribeUrls = onSnapshot(
      customUrlsRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            fetchCustomUrls();
            updateAudioMappingsWithUrl(change.doc.id);
          }
        });
      },
      (error) => {
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
  }, [fetchCustomUrls, fetchUpdatedAudioMapping, updateAudioMappingsWithUrl]);

  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem('quran_reading_position');

      if (!savedPosition) {
        return;
      }

      const position = JSON.parse(savedPosition);
      if (!position.surahNumber || !position.ayahNumber) {
        return;
      }

      setLastPlayedPosition(position);

      const showNotification = () => {
        if (surahs.length === 0) {
          setTimeout(showNotification, 500);
          return;
        }

        const surah = surahs.find((item) => item.id === position.surahNumber);
        if (surah) {
          toast.success(
            `Continue from where you left off: ${surah.name_simple} (${surah.name_arabic}), Ayah ${position.ayahNumber}`,
            { duration: 4000 }
          );
        }
      };

      setTimeout(showNotification, 1000);
    } catch (error) {
      console.error('Error restoring reading position:', error);
      localStorage.removeItem('quran_reading_position');
    }
  }, [surahs]);

  const dataValue = useMemo(
    () => ({
      surahs,
      loading,
      audioMappings,
      tafseerMappings,
      customUrls,
      currentSurah,
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
      fetchSurahVerses,
      fetchCustomUrls
    }),
    [
      surahs,
      loading,
      audioMappings,
      tafseerMappings,
      customUrls,
      currentSurah,
      lastPlayedPosition,
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
      fetchSurahVerses,
      fetchCustomUrls
    ]
  );

  const audioValue = useMemo(
    () => ({
      currentAudio,
      playingAyah,
      isPaused,
      playAudio,
      pauseAudio,
      resumeAudio,
      stopAudio
    }),
    [currentAudio, playingAyah, isPaused, playAudio, pauseAudio, resumeAudio, stopAudio]
  );

  return (
    <QuranDataContext.Provider value={dataValue}>
      <QuranAudioContext.Provider value={audioValue}>
        {children}
      </QuranAudioContext.Provider>
    </QuranDataContext.Provider>
  );
};