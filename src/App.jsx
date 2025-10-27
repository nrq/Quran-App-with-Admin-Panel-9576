import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { QuranProvider } from './contexts/QuranContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Surah from './pages/Surah';
import SearchResults from './pages/SearchResults';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Bookmarks from './pages/Bookmarks';
import SettingsPanel from './components/SettingsPanel';
import './App.css';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <AuthProvider>
      <QuranProvider>
        <Router>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="/surah/:surahNumber" element={<Surah />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
              </Route>
              <Route 
                path="/search" 
                element={<SearchResults onOpenSettings={() => setIsSettingsOpen(true)} />} 
              />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                },
              }}
            />
          </div>
        </Router>
      </QuranProvider>
    </AuthProvider>
  );
}

export default App;