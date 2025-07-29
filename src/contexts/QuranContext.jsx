import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [audioMappings, setAudioMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentSurah, setCurrentSurah] = useState(null);

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

  // Load audio mappings from localStorage
  useEffect(() => {
    const savedMappings = localStorage.getItem('quran_audio_mappings');
    if (savedMappings) {
      setAudioMappings(JSON.parse(savedMappings));
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

  const getAudioUrl = (surahNumber, ayahNumber) => {
    const key = `${surahNumber}:${ayahNumber}`;
    return audioMappings[key] || `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`;
  };

  const playAudio = (surahNumber, ayahNumber) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    const audioUrl = getAudioUrl(surahNumber, ayahNumber);
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('loadstart', () => {
      toast.loading('Loading audio...', { id: 'audio-loading' });
    });

    audio.addEventListener('canplay', () => {
      toast.dismiss('audio-loading');
    });

    audio.addEventListener('error', () => {
      toast.dismiss('audio-loading');
      toast.error('Failed to load audio');
    });

    audio.play().catch(() => {
      toast.error('Failed to play audio');
    });

    setCurrentAudio(audio);
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
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
    audioMappings,
    currentSurah,
    setCurrentSurah,
    saveAudioMapping,
    getAudioUrl,
    playAudio,
    stopAudio,
    fetchSurahVerses
  };

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
};