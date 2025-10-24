import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

// Mock Firebase modules
vi.mock('../../lib/firebase', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../utils/firebaseErrorHandler', () => ({
  handleFirebaseError: vi.fn((error) => error.message || 'An error occurred'),
  logFirebaseError: vi.fn()
}));

describe('AuthContext - Complete Authentication Flow', () => {
  let signInWithEmailAndPassword;
  let signOut;
  let onAuthStateChanged;
  let createUserWithEmailAndPassword;
  let collection;
  let query;
  let where;
  let getDocs;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import mocked modules
    const authModule = await import('firebase/auth');
    const firestoreModule = await import('firebase/firestore');
    
    signInWithEmailAndPassword = authModule.signInWithEmailAndPassword;
    signOut = authModule.signOut;
    onAuthStateChanged = authModule.onAuthStateChanged;
    createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword;
    collection = firestoreModule.collection;
    query = firestoreModule.query;
    where = firestoreModule.where;
    getDocs = firestoreModule.getDocs;
    
    // Default mock implementation for onAuthStateChanged
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // No user initially
      return vi.fn(); // Return unsubscribe function
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication State Management', () => {
    it('should initialize with unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should set authenticated state when Firebase user exists', async () => {
      const mockUser = { email: 'admin@quran-app.com', uid: 'test-uid' };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('Login Flow - Successful Authentication', () => {
    it('should successfully login existing admin user', async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [{ id: 'admin-1', data: () => ({ username: 'admin', password_hash: 'password123' }) }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);
      signInWithEmailAndPassword.mockResolvedValue({ user: { email: 'admin@quran-app.com' } });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin', 'password123');
      });

      expect(loginResult).toBe(true);
      expect(getDocs).toHaveBeenCalled();
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'admin@quran-app.com',
        'password123'
      );
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });

    it('should create Firebase auth user if not exists and admin is valid', async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [{ id: 'admin-1', data: () => ({ username: 'admin', password_hash: 'password123' }) }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);
      signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/user-not-found' });
      createUserWithEmailAndPassword.mockResolvedValue({ user: { email: 'admin@quran-app.com' } });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin', 'password123');
      });

      expect(loginResult).toBe(true);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'admin@quran-app.com',
        'password123'
      );
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });
  });

  describe('Login Flow - Failed Authentication', () => {
    it('should reject login with invalid credentials', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('invalid', 'wrong');
      });

      expect(loginResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle Firebase authentication errors', async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [{ id: 'admin-1', data: () => ({ username: 'admin', password_hash: 'password123' }) }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);
      signInWithEmailAndPassword.mockRejectedValue({ 
        code: 'auth/too-many-requests',
        message: 'Too many requests'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin', 'password123');
      });

      expect(loginResult).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle Firestore permission-denied error', async () => {
      getDocs.mockRejectedValue({ code: 'permission-denied' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin', 'password123');
      });

      expect(loginResult).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle Firestore unavailable error', async () => {
      getDocs.mockRejectedValue({ code: 'unavailable' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin', 'password123');
      });

      expect(loginResult).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', async () => {
      const mockUser = { email: 'admin@quran-app.com', uid: 'test-uid' };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      signOut.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(signOut).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
    });

    it('should handle logout errors', async () => {
      const mockUser = { email: 'admin@quran-app.com', uid: 'test-uid' };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      signOut.mockRejectedValue({ code: 'auth/network-request-failed' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(signOut).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across page refreshes', async () => {
      const mockUser = { email: 'admin@quran-app.com', uid: 'test-uid' };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate Firebase restoring session
        setTimeout(() => callback(mockUser), 100);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Initially loading
      expect(result.current.loading).toBe(true);

      // Wait for session to be restored
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should cleanup auth listener on unmount', async () => {
      const unsubscribe = vi.fn();
      onAuthStateChanged.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
