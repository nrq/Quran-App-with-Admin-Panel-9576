import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuranContext = createContext();

export const useQuran = () => {
  const context = useContext(QuranContext);
  if (!context) {
    throw new Error('useQuran must be used within a QuranProvider');
  }
  return context;
};

export const QuranProvider = ({ children }) => {
  const [surahs, setSurahs] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingAyah, setPlayingAyah] = useState(null);
  const [audioMappings, setAudioMappings] = useState({});
  const [tafseerMappings, setTafseerMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentSurah, setCurrentSurah] = useState(null);
  const audioRef = useRef(null);

  // Load Quran chapters list
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await axios.get('https://api.quran.com/api/v4/chapters');
        setSurahs(response.data.chapters);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching surahs:', error);
        toast.error('Failed to load Quran chapters');
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  // Load audio and tafseer mappings from localStorage
  useEffect(() => {
    const savedAudioMappings = localStorage.getItem('quran_audio_mappings');
    if (savedAudioMappings) {
      setAudioMappings(JSON.parse(savedAudioMappings));
    }

    const savedTafseerMappings = localStorage.getItem('quran_tafseer_mappings');
    if (savedTafseerMappings) {
      setTafseerMappings(JSON.parse(savedTafseerMappings));
    }
  }, []);

  const saveAudioMapping = (surahNumber, ayahNumber, audioUrl) => {
    const key = `${surahNumber}:${ayahNumber}`;
    const newMappings = {
      ...audioMappings,
      [key]: audioUrl
    };
    setAudioMappings(newMappings);
    localStorage.setItem('quran_audio_mappings', JSON.stringify(newMappings));
    toast.success('Audio mapping saved successfully');
  };

  const saveTafseerMapping = (surahNumber, ayahNumber, tafseerText) => {
    const key = `${surahNumber}:${ayahNumber}`;
    const newMappings = {
      ...tafseerMappings,
      [key]: tafseerText
    };
    setTafseerMappings(newMappings);
    localStorage.setItem('quran_tafseer_mappings', JSON.stringify(newMappings));
    toast.success('Tafseer saved successfully');
  };

  const getAudioUrl = (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    return audioMappings[key] || `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`;
  };

  const getTafseer = (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    return tafseerMappings[key] || '';
  };

  const playAudio = (surahNumber, ayahNumber) => {
    // If there's already audio playing, stop it
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create key for current playing ayah
    const ayahKey = `${surahNumber}:${ayahNumber}`;
    
    // Get the audio URL
    const audioUrl = getAudioUrl(surahNumber, ayahNumber);
    
    // Create a new audio element
    const audio = new Audio(audioUrl);
    
    // Set the audio reference
    audioRef.current = audio;
    
    // Show loading toast
    const loadingToastId = 'audio-loading';
    toast.loading('Loading audio...', { id: loadingToastId });
    
    // Add event listeners
    audio.addEventListener('canplay', () => {
      toast.dismiss(loadingToastId);
      audio.play()
        .then(() => {
          setPlayingAyah(ayahKey);
          setCurrentAudio(audio);
        })
        .catch((error) => {
          console.error('Error playing audio:', error);
          toast.error('Failed to play audio');
          setPlayingAyah(null);
        });
    });
    
    audio.addEventListener('ended', () => {
      setPlayingAyah(null);
      setCurrentAudio(null);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      toast.dismiss(loadingToastId);
      toast.error('Failed to load audio. Please try another ayah.');
      setPlayingAyah(null);
    });
    
    // Start loading the audio
    audio.load();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setCurrentAudio(null);
      setPlayingAyah(null);
    }
  };

  const fetchSurahVerses = async (surahNumber) => {
    try {
      const response = await axios.get(`https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?translations=131&fields=verse_key,text_uthmani,translations`);
      return response.data.verses;
    } catch (error) {
      console.error('Error fetching verses:', error);
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
    currentSurah,
    setCurrentSurah,
    saveAudioMapping,
    saveTafseerMapping,
    getAudioUrl,
    getTafseer,
    playAudio,
    stopAudio,
    fetchSurahVerses
  };

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
};