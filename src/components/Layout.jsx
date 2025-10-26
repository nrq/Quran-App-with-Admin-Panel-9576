import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';
import SettingsPanel from './SettingsPanel';

const { FiBook, FiSettings, FiCornerDownRight } = FiIcons;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastPlayedPosition } = useQuranData();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleResumeLastAyah = () => {
    if (!lastPlayedPosition?.surahNumber || !lastPlayedPosition?.ayahNumber) {
      return;
    }

    navigate(`/surah/${lastPlayedPosition.surahNumber}?ayah=${lastPlayedPosition.ayahNumber}`);
  };

  useEffect(() => {
    setIsSettingsOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-50 to-islamic-100">
      <nav className="bg-white shadow-lg border-b border-islamic-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-islamic-gold to-yellow-600 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiBook} className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-islamic-800">NurulQuran</span>
            </Link>

            <div className="flex items-center space-x-6">
              <button
                type="button"
                onClick={handleResumeLastAyah}
                disabled={!lastPlayedPosition}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-islamic-700 hover:bg-islamic-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={lastPlayedPosition ? `Resume ${lastPlayedPosition.surahNumber}:${lastPlayedPosition.ayahNumber}` : 'Last ayah not available yet'}
              >
                <SafeIcon icon={FiCornerDownRight} className="text-lg" />
                <span className="hidden sm:inline text-sm font-medium">Last Ayah</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-islamic-700 hover:bg-islamic-100 transition-colors"
                aria-expanded={isSettingsOpen}
                aria-controls="settings-panel"
              >
                <SafeIcon icon={FiSettings} className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Layout;