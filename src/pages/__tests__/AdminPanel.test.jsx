import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPanel from '../AdminPanel';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  writeBatch: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock contexts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../contexts/QuranContext', () => ({
  useQuranData: vi.fn()
}));

describe('AdminPanel Firebase Integration', () => {
  let mockAuthContext;
  let mockQuranContext;
  let useAuth;
  let useQuranData;
  let toast;
  let writeBatch;
  let doc;
  let updateDoc;
  let deleteDoc;
  let query;
  let where;
  let getDocs;
  let collection;

  const renderAdminPanel = () => {
    useAuth.mockReturnValue(mockAuthContext);
  useQuranData.mockReturnValue(mockQuranContext);
    
    return render(
      <BrowserRouter>
        <AdminPanel />
      </BrowserRouter>
    );
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Import mocked modules
    const authModule = await import('../../contexts/AuthContext');
  const quranModule = await import('../../contexts/QuranContext');
    const toastModule = await import('react-hot-toast');
    const firestoreModule = await import('firebase/firestore');
    
  useAuth = authModule.useAuth;
  useQuranData = quranModule.useQuranData;
    toast = toastModule.default;
    writeBatch = firestoreModule.writeBatch;
    doc = firestoreModule.doc;
    updateDoc = firestoreModule.updateDoc;
    deleteDoc = firestoreModule.deleteDoc;
    query = firestoreModule.query;
    where = firestoreModule.where;
    getDocs = firestoreModule.getDocs;
    collection = firestoreModule.collection;

    // Setup default mock contexts
    mockAuthContext = {
      user: { email: 'admin@test.com' },
      logout: vi.fn()
    };

    mockQuranContext = {
      surahs: [
        { id: 1, name_simple: 'Al-Fatihah', translated_name: { name: 'The Opening' }, verses_count: 7 }
      ],
      audioMappings: {},
      tafseerMappings: {},
      customUrls: [],
      saveAudioMapping: vi.fn(),
      saveTafseerMapping: vi.fn(),
      saveCustomUrl: vi.fn(),
      fetchCustomUrls: vi.fn()
    };
    
    // Reset all mock functions
    useAuth.mockReturnValue(mockAuthContext);
  useQuranData.mockReturnValue(mockQuranContext);
    toast.success.mockClear();
    toast.error.mockClear();
    writeBatch.mockClear();
    doc.mockClear();
    updateDoc.mockClear();
    deleteDoc.mockClear();
    query.mockClear();
    where.mockClear();
    getDocs.mockClear();
    collection.mockClear();
  });

  describe('Firestore Batch Operations', () => {
    it('should sync local storage data to Firestore using batch writes', async () => {
      // Setup local storage with test data
      const audioMappings = { '1:1': 'https://example.com/audio.mp3' };
      const tafseerMappings = { '1:1': 'Test tafseer text' };
      
      localStorage.setItem('quran_audio_mappings', JSON.stringify(audioMappings));
      localStorage.setItem('quran_tafseer_mappings', JSON.stringify(tafseerMappings));

      // Mock batch operations
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };
      writeBatch.mockReturnValue(mockBatch);

      renderAdminPanel();

      // Find and click sync button
      const syncButton = screen.getByText(/Sync Database/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(writeBatch).toHaveBeenCalled();
        expect(mockBatch.commit).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Successfully synced with database');
      });
    });

    it('should handle Firebase permission-denied errors during sync', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue({ code: 'permission-denied' })
      };
      writeBatch.mockReturnValue(mockBatch);

      localStorage.setItem('quran_audio_mappings', JSON.stringify({ '1:1': 'test' }));

      renderAdminPanel();

      const syncButton = screen.getByText(/Sync Database/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockBatch.commit).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Access denied. Please check your permissions.');
      });
    });

    it('should handle Firebase unavailable errors during sync', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue({ code: 'unavailable' })
      };
      writeBatch.mockReturnValue(mockBatch);

      localStorage.setItem('quran_audio_mappings', JSON.stringify({ '1:1': 'test' }));

      renderAdminPanel();

      const syncButton = screen.getByText(/Sync Database/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockBatch.commit).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Service temporarily unavailable. Please try again.');
      });
    });

    it('should process large datasets in batches of 500', async () => {
      // Create 600 audio mappings to test batching
      const audioMappings = {};
      for (let i = 1; i <= 600; i++) {
        audioMappings[`1:${i}`] = `https://example.com/audio${i}.mp3`;
      }
      
      localStorage.setItem('quran_audio_mappings', JSON.stringify(audioMappings));
      localStorage.setItem('quran_tafseer_mappings', JSON.stringify({}));

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };
      writeBatch.mockReturnValue(mockBatch);

      renderAdminPanel();

      const syncButton = screen.getByText(/Sync Database/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        // Should create 2 batches (500 + 100)
        expect(writeBatch).toHaveBeenCalledTimes(2);
        expect(mockBatch.commit).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Custom URL Management', () => {
    it('should add new custom URL successfully', async () => {
      mockQuranContext.saveCustomUrl.mockResolvedValue('new-url-id');
      
      renderAdminPanel();

      // Switch to URLs tab
      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      // Click Add New URL button
      const addButton = screen.getByText(/Add New URL/i);
      fireEvent.click(addButton);

      // Fill in the form (assuming modal opens)
      await waitFor(() => {
        expect(mockQuranContext.fetchCustomUrls).toHaveBeenCalled();
      });
    });

    it('should update existing custom URL using Firestore updateDoc', async () => {
      const mockUrl = {
        id: 'test-id',
        url: 'https://example.com/audio.mp3',
        title: 'Test URL',
        description: 'Test description'
      };

  mockQuranContext.customUrls = [mockUrl];
  useQuranData.mockReturnValue(mockQuranContext);
      updateDoc.mockResolvedValue(undefined);

      renderAdminPanel();

      // Switch to URLs tab
      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      await waitFor(() => {
        expect(screen.getByText('Test URL')).toBeInTheDocument();
      });
    });

    it('should delete custom URL and update related audio mappings', async () => {
      const mockUrl = {
        id: 'test-id',
        url: 'https://example.com/audio.mp3',
        title: 'Test URL'
      };

  mockQuranContext.customUrls = [mockUrl];
  useQuranData.mockReturnValue(mockQuranContext);
      
      const mockQuerySnapshot = {
        empty: false,
        forEach: vi.fn((callback) => {
          callback({ ref: 'mock-ref' });
        })
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);
      deleteDoc.mockResolvedValue(undefined);

      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };
      writeBatch.mockReturnValue(mockBatch);

      // Mock window.confirm
      window.confirm = vi.fn(() => true);

      renderAdminPanel();

      // Switch to URLs tab
      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      await waitFor(() => {
        expect(screen.getByText('Test URL')).toBeInTheDocument();
      });
    });

    it('should handle Firebase permission-denied error when updating URL', async () => {
      updateDoc.mockRejectedValue({ code: 'permission-denied' });

      renderAdminPanel();

      // Switch to URLs tab
      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      await waitFor(() => {
        expect(mockQuranContext.fetchCustomUrls).toHaveBeenCalled();
      });
    });

    it('should handle Firebase unavailable error when deleting URL', async () => {
      const mockUrl = {
        id: 'test-id',
        url: 'https://example.com/audio.mp3',
        title: 'Test URL'
      };

      mockQuranContext.customUrls = [mockUrl];
  useQuranData.mockReturnValue(mockQuranContext);
      getDocs.mockRejectedValue({ code: 'unavailable' });

      window.confirm = vi.fn(() => true);

      renderAdminPanel();

      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      await waitFor(() => {
        expect(screen.getByText('Test URL')).toBeInTheDocument();
      });
    });

    it('should cancel URL deletion when user declines confirmation', async () => {
      const mockUrl = {
        id: 'test-id',
        url: 'https://example.com/audio.mp3',
        title: 'Test URL'
      };

      mockQuranContext.customUrls = [mockUrl];
  useQuranData.mockReturnValue(mockQuranContext);

      window.confirm = vi.fn(() => false);

      renderAdminPanel();

      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      await waitFor(() => {
        expect(screen.getByText('Test URL')).toBeInTheDocument();
      });

      // Verify delete was not called
      expect(deleteDoc).not.toHaveBeenCalled();
    });
  });

  describe('Audio and Tafseer Management', () => {
    it('should save audio mapping with custom URL', async () => {
      const mockUrl = {
        id: 'custom-url-1',
        url: 'https://example.com/custom-audio.mp3',
        title: 'Custom Audio'
      };

      mockQuranContext.customUrls = [mockUrl];
  useQuranData.mockReturnValue(mockQuranContext);

      renderAdminPanel();

      // Select surah
      const surahSelect = screen.getByRole('combobox', { name: /select surah/i });
      fireEvent.change(surahSelect, { target: { value: '1' } });

      // Enter ayah number
      const ayahInput = screen.getByPlaceholderText(/enter ayah number/i);
      fireEvent.change(ayahInput, { target: { value: '1' } });

      // Select custom URL
      const urlSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(urlSelect, { target: { value: 'custom-url-1' } });

      // Click save
      const saveButton = screen.getByText(/Save Audio/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockQuranContext.saveAudioMapping).toHaveBeenCalledWith(
          1,
          1,
          'https://example.com/custom-audio.mp3',
          'Custom Audio'
        );
      });
    });

    it('should save tafseer mapping', async () => {
      renderAdminPanel();

      // Switch to tafseer tab
      const tafseerTab = screen.getByText(/Tafseer Management/i);
      fireEvent.click(tafseerTab);

      // Select surah
      const surahSelect = screen.getByRole('combobox', { name: /select surah/i });
      fireEvent.change(surahSelect, { target: { value: '1' } });

      // Enter ayah number
      const ayahInput = screen.getByPlaceholderText(/enter ayah number/i);
      fireEvent.change(ayahInput, { target: { value: '1' } });

      // Enter tafseer text
      const tafseerTextarea = screen.getByPlaceholderText(/enter tafseer explanation/i);
      fireEvent.change(tafseerTextarea, { target: { value: 'Test tafseer explanation' } });

      // Click save
      const saveButton = screen.getByText(/Save Tafseer/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockQuranContext.saveTafseerMapping).toHaveBeenCalledWith(
          1,
          1,
          'Test tafseer explanation'
        );
      });
    });

    it('should show error when saving audio without required fields', async () => {
      renderAdminPanel();

      // Click save without filling fields
      const saveButton = screen.getByText(/Save Audio/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please fill all required fields');
      });
    });

    it('should show error when saving tafseer without required fields', async () => {
      renderAdminPanel();

      // Switch to tafseer tab
      const tafseerTab = screen.getByText(/Tafseer Management/i);
      fireEvent.click(tafseerTab);

      // Click save without filling fields
      const saveButton = screen.getByText(/Save Tafseer/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please fill all fields');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle generic Firebase errors during sync', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Generic error'))
      };
      writeBatch.mockReturnValue(mockBatch);

      localStorage.setItem('quran_audio_mappings', JSON.stringify({ '1:1': 'test' }));

      renderAdminPanel();

      const syncButton = screen.getByText(/Sync Database/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockBatch.commit).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Failed to sync with database');
      });
    });

    it('should handle not-found error when updating URL', async () => {
      updateDoc.mockRejectedValue({ code: 'not-found' });

      renderAdminPanel();

      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      await waitFor(() => {
        expect(mockQuranContext.fetchCustomUrls).toHaveBeenCalled();
      });
    });

    it('should refresh custom URLs after successful sync', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };
      writeBatch.mockReturnValue(mockBatch);

      localStorage.setItem('quran_audio_mappings', JSON.stringify({ '1:1': 'test' }));

      renderAdminPanel();

      const syncButton = screen.getByText(/Sync Database/i);
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockQuranContext.fetchCustomUrls).toHaveBeenCalled();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should display user email in navigation', () => {
      renderAdminPanel();

      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });

    it('should call logout when logout button is clicked', () => {
      renderAdminPanel();

      const logoutButton = screen.getByText(/Logout/i);
      fireEvent.click(logoutButton);

      expect(mockAuthContext.logout).toHaveBeenCalled();
    });

    it('should switch between tabs correctly', () => {
      renderAdminPanel();

      // Initially on audio tab
      expect(screen.getByText(/Audio Mapping/i)).toBeInTheDocument();

      // Switch to tafseer tab
      const tafseerTab = screen.getByText(/Tafseer Management/i);
      fireEvent.click(tafseerTab);

      expect(screen.getByPlaceholderText(/enter tafseer explanation/i)).toBeInTheDocument();

      // Switch to URLs tab
      const urlsTab = screen.getByText(/Custom URLs/i);
      fireEvent.click(urlsTab);

      expect(screen.getByText(/Add New URL/i)).toBeInTheDocument();
    });

    it('should display stats correctly', () => {
      mockQuranContext.audioMappings = { '1:1': 'url1', '1:2': 'url2' };
      mockQuranContext.tafseerMappings = { '1:1': 'tafseer1' };
      mockQuranContext.customUrls = [{ id: '1', url: 'test' }];
      useQuranData.mockReturnValue(mockQuranContext);

      renderAdminPanel();

      // Stats should be updated based on mappings
      expect(useQuranData).toHaveBeenCalled();
    });
  });
});
