import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

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
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth session:', error);
        }
        
        if (session) {
          setIsAuthenticated(true);
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (username, password) => {
    try {
      // First, check if the user exists in our admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users_qr84fm')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();
        
      if (adminError || !adminData) {
        toast.error('Invalid credentials');
        return false;
      }
      
      // If admin exists in our table, create an auth session
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username}@quran-app.com`, // Create a pseudo email for auth
        password: password,
      });
      
      if (error) {
        // If user doesn't exist in auth, sign them up first
        if (error.message.includes("Invalid login credentials")) {
          const { error: signupError } = await supabase.auth.signUp({
            email: `${username}@quran-app.com`,
            password: password,
          });
          
          if (signupError) {
            console.error('Error signing up:', signupError);
            toast.error('Authentication failed');
            return false;
          }
          
          // Try logging in again after signup
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: `${username}@quran-app.com`,
            password: password,
          });
          
          if (loginError) {
            console.error('Error logging in after signup:', loginError);
            toast.error('Authentication failed');
            return false;
          }
        } else {
          console.error('Error logging in:', error);
          toast.error('Authentication failed');
          return false;
        }
      }
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
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