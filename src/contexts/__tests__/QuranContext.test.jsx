import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QuranProvider, useQuran } from '../QuranContext';
import toast from 'react-hot-toast';

// Mock Firebase modules
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp')
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'loading-toast-id'),
    dismiss: vi.fn()
  }
}));

vi.mock('../../utils/firebaseErrorHandler', () => ({
  handleFirebaseError: vi.fn((error) => error.message || 'An error occurred'),
  logFirebaseError: vi.fn()
}));

// Mock offline data
vi.mock('../../data/quran-data.js', () => ({
  getAllSurahsInfo: vi.fn(() => [
    { id: 1, name_simple: 'Al-Fatihah', translated_name: { name: 'The Opening' }, verses_count: 7 },
    { id: 2, name_simple: 'Al-Baqarah', translated_name: { name: 'The Cow' }, verses_count: 286 }
  ]),
  getSurahVerses: vi.fn((surahNumber) => 
    Promise.resolve([
      { verse_key: `${surahNumber}:1`, text_uthmani: 'Test verse 1' },
      { verse_key: `${surahNumber}:2`, text_uthmani: 'Test verse 2' }
    ])
  )
}));

describe('QuranContext - CRUD Operations', () => {
  let collection;
  let getDocs;
  let query;
  let where;
  let onSnapshot;
  let addDoc;
  let updateDoc;
  let deleteDoc;
  let doc;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Import mocked modules
    const firestoreModule = await import('firebase/firestore');
    
    collection = firestoreModule.collection;
    getDocs = firestoreModule.getDocs;
    query = firestoreModule.query;
    where = firestoreModule.where;
    onSnapshot = firestoreModule.onSnapshot;
    addDoc = firestoreModule.addDoc;
    updateDoc = firestoreModule.updateDoc;
    deleteDoc = firestoreModule.deleteDoc;
    doc = firestoreModule.doc;
    
    // Default mock implementations
    onSnapshot.mockImplementation(() => vi.fn()); // Return unsubscribe function
    getDocs.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Data Loading', () => {
    it('should load surahs from offline data on initialization', async () => {
      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.surahs).toHaveLength(2);
      expect(result.current.surahs[0].name_simple).toBe('Al-Fatihah');
    });

    it('should fetch custom URLs from Firestore on initialization', async () => {
      const mockUrls = [
        { id: 'url-1', url: 'https://example.com/audio1.mp3', title: 'Custom Audio 1' },
        { id: 'url-2', url: 'https://example.com/audio2.mp3', title: 'Custom Audio 2' }
      ];

      getDocs.mockResolvedValue({
        docs: mockUrls.map(url => ({
          id: url.id,
          data: () => ({ url: url.url, title: url.title })
        }))
      });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.customUrls).toHaveLength(2);
      });

      expect(result.current.customUrls[0].url).toBe('https://example.com/audio1.mp3');
    });

    it('should fetch audio mappings from Firestore on initialization', async () => {
      const mockAudioMappings = [
        { surah_number: 1, ayah_number: 1, audio_url: 'https://example.com/1-1.mp3', custom_url_id: null }
      ];

      getDocs.mockResolvedValue({
        docs: mockAudioMappings.map(mapping => ({
          id: 'mapping-1',
          data: () => mapping
        }))
      });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.audioMappings['1:1']).toBeDefined();
      });

      expect(result.current.audioMappings['1:1'].url).toBe('https://example.com/1-1.mp3');
    });

    it('should fetch tafseer mappings from Firestore on initialization', async () => {
      const mockTafseerMappings = [
        { surah_number: 1, ayah_number: 1, tafseer_text: 'Test tafseer explanation' }
      ];

      getDocs.mockResolvedValue({
        docs: mockTafseerMappings.map(mapping => ({
          id: 'tafseer-1',
          data: () => mapping
        }))
      });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.tafseerMappings['1:1']).toBeDefined();
      });

      expect(result.current.tafseerMappings['1:1']).toBe('Test tafseer explanation');
    });
  });

  describe('Custom URL CRUD Operations', () => {
    it('should create a new custom URL', async () => {
      addDoc.mockResolvedValue({ id: 'new-url-id' });
      getDocs.mockResolvedValue({ docs: [] });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let urlId;
      await act(async () => {
        urlId = await result.current.createCustomUrl(
          'https://example.com/new-audio.mp3',
          'New Audio',
          'Test description'
        );
      });

      expect(urlId).toBe('new-url-id');
      expect(addDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Custom URL created successfully');
    });

    it('should update an existing custom URL', async () => {
      updateDoc.mockResolvedValue();
      getDocs.mockResolvedValue({ docs: [] });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.updateCustomUrl('url-1', {
          title: 'Updated Title',
          description: 'Updated description'
        });
      });

      expect(success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Custom URL updated successfully');
    });

    it('should delete a custom URL when not in use', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true });
      deleteDoc.mockResolvedValue();

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteCustomUrl('url-1');
      });

      expect(success).toBe(true);
      expect(deleteDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Custom URL deleted successfully');
    });

    it('should prevent deletion of custom URL in use', async () => {
      getDocs.mockResolvedValue({
        docs: [{ id: 'mapping-1' }],
        empty: false
      });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteCustomUrl('url-1');
      });

      expect(success).toBe(false);
      expect(deleteDoc).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Cannot delete URL: it is being used by audio mappings');
    });

    it('should upsert custom URL - create if not exists', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true });
      addDoc.mockResolvedValue({ id: 'new-url-id' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let urlId;
      await act(async () => {
        urlId = await result.current.saveCustomUrl(
          'https://example.com/audio.mp3',
          'Audio Title'
        );
      });

      expect(urlId).toBe('new-url-id');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should upsert custom URL - update if exists', async () => {
      getDocs.mockResolvedValue({
        docs: [{ id: 'existing-url-id', data: () => ({ url: 'https://example.com/audio.mp3' }) }],
        empty: false
      });
      updateDoc.mockResolvedValue();

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let urlId;
      await act(async () => {
        urlId = await result.current.saveCustomUrl(
          'https://example.com/audio.mp3',
          'Updated Title'
        );
      });

      expect(urlId).toBe('existing-url-id');
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('Audio Mapping CRUD Operations', () => {
    it('should create a new audio mapping', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true });
      addDoc.mockResolvedValue({ id: 'new-mapping-id' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.saveAudioMapping(
          1,
          1,
          'https://example.com/audio.mp3',
          'Custom Audio'
        );
      });

      expect(success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Audio mapping saved successfully');
      expect(result.current.audioMappings['1:1']).toBeDefined();
    });

    it('should update an existing audio mapping', async () => {
      getDocs.mockResolvedValue({
        docs: [{ id: 'existing-mapping-id', data: () => ({ surah_number: 1, ayah_number: 1 }) }],
        empty: false
      });
      updateDoc.mockResolvedValue();

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.saveAudioMapping(
          1,
          1,
          'https://example.com/updated-audio.mp3'
        );
      });

      expect(success).toBe(true);
      expect(updateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Audio mapping saved successfully');
    });

    it('should delete an audio mapping', async () => {
      getDocs.mockResolvedValue({
        docs: [{ id: 'mapping-to-delete' }],
        empty: false
      });
      deleteDoc.mockResolvedValue();

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First add a mapping to state
      await act(async () => {
        result.current.audioMappings['1:1'] = { url: 'test' };
      });

      let success;
      await act(async () => {
        success = await result.current.deleteAudioMapping(1, 1);
      });

      expect(success).toBe(true);
      expect(deleteDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Audio mapping deleted successfully');
    });

    it('should fallback to localStorage when Firestore fails', async () => {
      getDocs.mockRejectedValue({ code: 'unavailable' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveAudioMapping(
          1,
          1,
          'https://example.com/audio.mp3'
        );
      });

      expect(toast.error).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'quran_audio_mappings',
        expect.any(String)
      );
    });
  });

  describe('Tafseer Mapping CRUD Operations', () => {
    it('should create a new tafseer entry', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true });
      addDoc.mockResolvedValue({ id: 'new-tafseer-id' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveTafseerMapping(1, 1, 'Test tafseer explanation');
      });

      expect(addDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Tafseer saved successfully');
      expect(result.current.tafseerMappings['1:1']).toBe('Test tafseer explanation');
    });

    it('should update an existing tafseer entry', async () => {
      getDocs.mockResolvedValue({
        docs: [{ id: 'existing-tafseer-id', data: () => ({ surah_number: 1, ayah_number: 1 }) }],
        empty: false
      });
      updateDoc.mockResolvedValue();

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveTafseerMapping(1, 1, 'Updated tafseer explanation');
      });

      expect(updateDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Tafseer saved successfully');
    });

    it('should delete a tafseer entry', async () => {
      getDocs.mockResolvedValue({
        docs: [{ id: 'tafseer-to-delete' }],
        empty: false
      });
      deleteDoc.mockResolvedValue();

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteTafseerMapping(1, 1);
      });

      expect(success).toBe(true);
      expect(deleteDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Tafseer deleted successfully');
    });

    it('should fallback to localStorage when Firestore fails', async () => {
      getDocs.mockRejectedValue({ code: 'permission-denied' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveTafseerMapping(1, 1, 'Test tafseer');
      });

      expect(toast.error).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'quran_tafseer_mappings',
        expect.any(String)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle permission-denied errors', async () => {
      addDoc.mockRejectedValue({ code: 'permission-denied' });
      getDocs.mockResolvedValue({ docs: [], empty: true });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createCustomUrl('https://example.com/audio.mp3');
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle unavailable errors', async () => {
      updateDoc.mockRejectedValue({ code: 'unavailable' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateCustomUrl('url-1', { title: 'New Title' });
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle not-found errors', async () => {
      deleteDoc.mockRejectedValue({ code: 'not-found' });
      getDocs.mockResolvedValue({ docs: [], empty: true });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteCustomUrl('non-existent-url');
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('should setup real-time listeners for audio mappings', async () => {
      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify onSnapshot was called for audio_mappings
      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should cleanup listeners on unmount', async () => {
      const unsubscribe = vi.fn();
      onSnapshot.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(onSnapshot).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Offline Data Synchronization', () => {
    it('should sync audio mappings to localStorage', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true });
      addDoc.mockResolvedValue({ id: 'new-mapping-id' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveAudioMapping(1, 1, 'https://example.com/audio.mp3');
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'quran_audio_mappings',
        expect.stringContaining('1:1')
      );
    });

    it('should sync tafseer mappings to localStorage', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true });
      addDoc.mockResolvedValue({ id: 'new-tafseer-id' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.saveTafseerMapping(1, 1, 'Test tafseer');
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'quran_tafseer_mappings',
        expect.stringContaining('1:1')
      );
    });

    it('should load from localStorage when Firestore fails', async () => {
      const savedMappings = { '1:1': { url: 'https://example.com/audio.mp3' } };
      localStorage.setItem('quran_audio_mappings', JSON.stringify(savedMappings));

      getDocs.mockRejectedValue({ code: 'unavailable' });

      const { result } = renderHook(() => useQuran(), {
        wrapper: QuranProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have loaded from localStorage
      expect(localStorage.getItem).toHaveBeenCalledWith('quran_audio_mappings');
    });
  });
});
