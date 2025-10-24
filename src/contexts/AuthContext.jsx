import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { handleFirebaseError, logFirebaseError } from '../utils/firebaseErrorHandler';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check for existing session on load
  useEffect(() => {
    // Set up Firebase auth state change listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
        setUser(firebaseUser);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (username, password) => {
    try {
      // First, check if the user exists in our admin_users collection
      const adminUsersRef = collection(db, 'admin_users');
      const q = query(
        adminUsersRef,
        where('username', '==', username),
        where('password_hash', '==', password)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Invalid credentials');
        return false;
      }
      
      // If admin exists in our collection, create a Firebase auth session
      const email = `${username}@quran-app.com`; // Create a pseudo email for auth
      
      try {
        // Try to sign in with Firebase Authentication
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login successful!');
        return true;
      } catch (error) {
        // If user doesn't exist in Firebase Auth, create the account first
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            toast.success('Login successful!');
            return true;
          } catch (signupError) {
            logFirebaseError('Create Auth User', signupError);
            const errorMessage = handleFirebaseError(signupError);
            toast.error(errorMessage);
            return false;
          }
        } else {
          logFirebaseError('Login', error);
          const errorMessage = handleFirebaseError(error);
          toast.error(errorMessage);
          return false;
        }
      }
    } catch (error) {
      logFirebaseError('Admin User Validation', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      logFirebaseError('Logout', error);
      const errorMessage = handleFirebaseError(error);
      toast.error(errorMessage);
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};