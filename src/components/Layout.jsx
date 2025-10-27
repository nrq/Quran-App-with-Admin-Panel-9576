import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';
import SettingsPanel from './SettingsPanel';
import SearchBar from './SearchBar';

const { FiBook, FiSettings, FiCornerDownRight } = FiIcons;

const THEME_STYLES = {
  green: {
    shell: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900',
    navBg: 'bg-white',
    navBorder: 'border-emerald-200',
    navText: 'text-emerald-800',
    brandBadge: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    brandText: 'text-emerald-900',
    navButton: 'text-emerald-700 hover:bg-emerald-100',
    settingsButton: 'text-emerald-700 hover:bg-emerald-100',
    navIcon: 'text-emerald-600'
  },
  red: {
    shell: 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-900',
    navBg: 'bg-white',
    navBorder: 'border-rose-200',
    navText: 'text-rose-800',
    brandBadge: 'bg-gradient-to-br from-rose-500 to-rose-600',
    brandText: 'text-rose-900',
    navButton: 'text-rose-700 hover:bg-rose-100',
    settingsButton: 'text-rose-700 hover:bg-rose-100',
    navIcon: 'text-rose-600'
  },
  blue: {
    shell: 'bg-gradient-to-br from-sky-50 to-sky-100 text-sky-900',
    navBg: 'bg-white',
    navBorder: 'border-sky-200',
    navText: 'text-sky-800',
    brandBadge: 'bg-gradient-to-br from-sky-500 to-sky-600',
    brandText: 'text-sky-900',
    navButton: 'text-sky-700 hover:bg-sky-100',
    settingsButton: 'text-sky-700 hover:bg-sky-100',
    navIcon: 'text-sky-600'
  },
  light: {
    shell: 'bg-gradient-to-br from-islamic-50 to-islamic-100 text-islamic-800',
    navBg: 'bg-white',
    navBorder: 'border-slate-200',
    navText: 'text-slate-700',
    brandBadge: 'bg-gradient-to-br from-islamic-gold to-yellow-600',
    brandText: 'text-islamic-800',
    navButton: 'text-slate-700 hover:bg-slate-100',
    settingsButton: 'text-slate-700 hover:bg-slate-100',
    navIcon: 'text-slate-600'
  },
  dark: {
    shell: 'bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100',
    navBg: 'bg-slate-900',
    navBorder: 'border-slate-700',
    navText: 'text-slate-100',
    brandBadge: 'bg-gradient-to-br from-slate-700 to-slate-600',
    brandText: 'text-slate-100',
    navButton: 'text-slate-100 hover:bg-slate-800',
    settingsButton: 'text-slate-100 hover:bg-slate-800',
    navIcon: 'text-slate-200'
  },
  sepia: {
    shell: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900',
    navBg: 'bg-white',
    navBorder: 'border-amber-200',
    navText: 'text-amber-800',
    brandBadge: 'bg-gradient-to-br from-amber-500 to-amber-600',
    brandText: 'text-amber-900',
    navButton: 'text-amber-700 hover:bg-amber-100',
    settingsButton: 'text-amber-700 hover:bg-amber-100',
    navIcon: 'text-amber-600'
  }
};

const DEFAULT_THEME_STYLE = THEME_STYLES.green;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastPlayedPosition, theme } = useQuranData();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const themeStyles = THEME_STYLES[theme] ?? DEFAULT_THEME_STYLE;
  const shellClasses = `min-h-screen transition-colors duration-300 ${themeStyles.shell}`;
  const navClasses = `shadow-lg border-b ${themeStyles.navBg} ${themeStyles.navBorder} ${themeStyles.navText}`;
  const brandBadgeClasses = `w-10 h-10 rounded-lg flex items-center justify-center ${themeStyles.brandBadge}`;
  const brandTextClass = `text-2xl font-bold ${themeStyles.brandText}`;
  const baseNavButtonClasses =
    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const lastAyahButtonClass = `${baseNavButtonClasses} ${themeStyles.navButton}`;
  const settingsButtonClass = `${baseNavButtonClasses} ${themeStyles.settingsButton}`;
  const navIconClass = `text-lg ${themeStyles.navIcon}`;

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
    <div className={shellClasses}>
      <nav className={navClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className={brandBadgeClasses}>
                <SafeIcon icon={FiBook} className="text-white text-xl" />
              </div>
              <span className={brandTextClass}>NurulQuran</span>
            </Link>

            <div className="flex-1 hidden md:flex justify-center">
              <SearchBar variant="nav" />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleResumeLastAyah}
                disabled={!lastPlayedPosition}
                className={lastAyahButtonClass}
                title={lastPlayedPosition ? `Resume ${lastPlayedPosition.surahNumber}:${lastPlayedPosition.ayahNumber}` : 'Last ayah not available yet'}
              >
                <SafeIcon icon={FiCornerDownRight} className={navIconClass} />
                <span className="hidden sm:inline text-sm font-medium">Last Ayah</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className={settingsButtonClass}
                aria-expanded={isSettingsOpen}
                aria-controls="settings-panel"
              >
                <SafeIcon icon={FiSettings} className={navIconClass} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:hidden mb-6">
          <SearchBar />
        </div>
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