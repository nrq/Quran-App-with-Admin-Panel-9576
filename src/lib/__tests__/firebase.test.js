import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Firebase modules before importing
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' }))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null }))
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({ type: 'firestore' })),
  persistentLocalCache: vi.fn((config) => ({ 
    type: 'persistentLocalCache',
    config 
  })),
  persistentMultipleTabManager: vi.fn(() => ({ 
    type: 'persistentMultipleTabManager' 
  }))
}));

describe('Firebase Configuration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Set up environment variables
    import.meta.env.VITE_FIREBASE_API_KEY = 'test-api-key';
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    import.meta.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
    import.meta.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef';
  });

  it('should initialize Firebase with offline persistence and multi-tab support', async () => {
    const { initializeApp } = await import('firebase/app');
    const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = await import('firebase/firestore');
    
    // Import the firebase module to trigger initialization
    await import('../firebase.js');
    
    // Verify Firebase app was initialized
    expect(initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project'
      })
    );
    
    // Verify Firestore was initialized with persistence
    expect(initializeFirestore).toHaveBeenCalled();
    expect(persistentLocalCache).toHaveBeenCalled();
    expect(persistentMultipleTabManager).toHaveBeenCalled();
  });
});
