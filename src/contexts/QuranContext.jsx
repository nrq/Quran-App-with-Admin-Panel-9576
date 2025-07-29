import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import supabase from '../lib/supabase';

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
  const [customUrls, setCustomUrls] = useState([]);
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

  // Load audio, tafseer mappings and custom URLs from Supabase
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        // Fetch custom URLs from Supabase
        const { data: urlsData, error: urlsError } = await supabase
          .from('custom_urls_qr84fm')
          .select('*');
        
        if (urlsError) throw urlsError;
        setCustomUrls(urlsData || []);
        
        // Fetch audio mappings from Supabase
        const { data: audioData, error: audioError } = await supabase
          .from('audio_mappings_qr84fm')
          .select(`
            *,
            custom_url: custom_url_id(id, url, title)
          `);
        
        if (audioError) throw audioError;
        
        // Convert to key-value mapping format
        const audioMap = {};
        audioData?.forEach(mapping => {
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          audioMap[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl: mapping.custom_url ? mapping.custom_url.url : null
          };
        });
        setAudioMappings(audioMap);
        
        // Fetch tafseer mappings from Supabase
        const { data: tafseerData, error: tafseerError } = await supabase
          .from('tafseer_entries_qr84fm')
          .select('*');
        
        if (tafseerError) throw tafseerError;
        
        // Convert to key-value mapping format
        const tafseerMap = {};
        tafseerData?.forEach(mapping => {
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          tafseerMap[key] = mapping.tafseer_text;
        });
        setTafseerMappings(tafseerMap);
      } catch (error) {
        console.error('Error fetching mappings from Supabase:', error);
        
        // Fallback to localStorage if Supabase fails
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

  // Set up real-time subscription for updates
  useEffect(() => {
    const audioSubscription = supabase
      .channel('audio_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'audio_mappings_qr84fm' }, 
        payload => {
          if (payload.new) {
            fetchUpdatedAudioMapping(payload.new.surah_number, payload.new.ayah_number);
          }
        }
      )
      .subscribe();
      
    const tafseerSubscription = supabase
      .channel('tafseer_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tafseer_entries_qr84fm' }, 
        payload => {
          if (payload.new) {
            const { surah_number, ayah_number, tafseer_text } = payload.new;
            const key = `${surah_number}:${ayah_number}`;
            setTafseerMappings(prev => ({ ...prev, [key]: tafseer_text }));
          }
        }
      )
      .subscribe();
      
    const urlsSubscription = supabase
      .channel('url_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'custom_urls_qr84fm' }, 
        payload => {
          if (payload.new) {
            // Refresh custom URLs list
            fetchCustomUrls();
            // Update any audio mappings that might use this URL
            updateAudioMappingsWithUrl(payload.new.id);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(audioSubscription);
      supabase.removeChannel(tafseerSubscription);
      supabase.removeChannel(urlsSubscription);
    };
  }, []);

  // Fetch a single updated audio mapping
  const fetchUpdatedAudioMapping = async (surahNumber, ayahNumber) => {
    try {
      const { data, error } = await supabase
        .from('audio_mappings_qr84fm')
        .select(`
          *,
          custom_url: custom_url_id(id, url, title)
        `)
        .eq('surah_number', surahNumber)
        .eq('ayah_number', ayahNumber)
        .single();
        
      if (error) throw error;
      
      if (data) {
        const key = `${surahNumber}:${ayahNumber}`;
        setAudioMappings(prev => ({
          ...prev, 
          [key]: {
            url: data.audio_url,
            customUrlId: data.custom_url_id,
            customUrl: data.custom_url ? data.custom_url.url : null
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching updated audio mapping:', error);
    }
  };

  // Fetch all custom URLs
  const fetchCustomUrls = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_urls_qr84fm')
        .select('*');
        
      if (error) throw error;
      
      setCustomUrls(data || []);
    } catch (error) {
      console.error('Error fetching custom URLs:', error);
    }
  };

  // Update audio mappings when a custom URL changes
  const updateAudioMappingsWithUrl = async (urlId) => {
    try {
      const { data, error } = await supabase
        .from('audio_mappings_qr84fm')
        .select(`
          *,
          custom_url: custom_url_id(id, url, title)
        `)
        .eq('custom_url_id', urlId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const updatedMappings = { ...audioMappings };
        
        data.forEach(mapping => {
          const key = `${mapping.surah_number}:${mapping.ayah_number}`;
          updatedMappings[key] = {
            url: mapping.audio_url,
            customUrlId: mapping.custom_url_id,
            customUrl: mapping.custom_url ? mapping.custom_url.url : null
          };
        });
        
        setAudioMappings(updatedMappings);
      }
    } catch (error) {
      console.error('Error updating audio mappings with URL:', error);
    }
  };

  // Create or update a custom URL
  const saveCustomUrl = async (url, title = '', description = '') => {
    try {
      // Check if URL already exists
      const { data: existingUrl, error: checkError } = await supabase
        .from('custom_urls_qr84fm')
        .select('id')
        .eq('url', url)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      let urlId;
      
      if (existingUrl) {
        // Update existing URL
        const { data, error } = await supabase
          .from('custom_urls_qr84fm')
          .update({ 
            title, 
            description,
            updated_at: new Date()
          })
          .eq('id', existingUrl.id)
          .select('id')
          .single();
          
        if (error) throw error;
        urlId = data.id;
      } else {
        // Create new URL
        const { data, error } = await supabase
          .from('custom_urls_qr84fm')
          .insert({ 
            url, 
            title, 
            description,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select('id')
          .single();
          
        if (error) throw error;
        urlId = data.id;
      }
      
      // Refresh custom URLs list
      fetchCustomUrls();
      
      return urlId;
    } catch (error) {
      console.error('Error saving custom URL:', error);
      toast.error('Failed to save custom URL');
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
      
      // Save to Supabase
      const { error } = await supabase
        .from('audio_mappings_qr84fm')
        .upsert({ 
          surah_number: surahNumber, 
          ayah_number: ayahNumber, 
          audio_url: audioUrl,
          custom_url_id: customUrlId,
          updated_at: new Date()
        }, { 
          onConflict: 'surah_number,ayah_number' 
        });
      
      if (error) throw error;
      
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
      console.error('Error saving audio mapping:', error);
      
      // Fallback to localStorage only if Supabase fails
      const newMappings = { 
        ...audioMappings, 
        [key]: {
          url: audioUrl,
          customUrl: audioUrl
        }
      };
      setAudioMappings(newMappings);
      localStorage.setItem('quran_audio_mappings', JSON.stringify(newMappings));
      
      toast.success('Audio mapping saved locally');
      return false;
    }
  };

  const saveTafseerMapping = async (surahNumber, ayahNumber, tafseerText) => {
    const key = `${surahNumber}:${ayahNumber}`;
    
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('tafseer_entries_qr84fm')
        .upsert({ 
          surah_number: surahNumber, 
          ayah_number: ayahNumber, 
          tafseer_text: tafseerText,
          updated_at: new Date()
        }, { 
          onConflict: 'surah_number,ayah_number' 
        });
      
      if (error) throw error;
      
      // Update local state
      const newMappings = { ...tafseerMappings, [key]: tafseerText };
      setTafseerMappings(newMappings);
      
      // Backup to localStorage
      localStorage.setItem('quran_tafseer_mappings', JSON.stringify(newMappings));
      
      toast.success('Tafseer saved successfully');
    } catch (error) {
      console.error('Error saving tafseer:', error);
      
      // Fallback to localStorage only if Supabase fails
      const newMappings = { ...tafseerMappings, [key]: tafseerText };
      setTafseerMappings(newMappings);
      localStorage.setItem('quran_tafseer_mappings', JSON.stringify(newMappings));
      
      toast.success('Tafseer saved locally');
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
    const loadingToastId = toast.loading('Loading audio...');
    
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
    customUrls,
    currentSurah,
    setCurrentSurah,
    saveAudioMapping,
    saveTafseerMapping,
    saveCustomUrl,
    getAudioUrl,
    getTafseer,
    playAudio,
    stopAudio,
    fetchSurahVerses,
    fetchCustomUrls
  };

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
};