import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import OfflineIndicator from './OfflineIndicator';

const { FiBook, FiSettings, FiHome } = FiIcons;

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-50 to-islamic-100">
      <nav className="bg-white shadow-lg border-b border-islamic-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-islamic-gold to-yellow-600 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiBook} className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-islamic-800">Al-Quran</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link 
                to="/" 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-islamic-gold text-white' 
                    : 'text-islamic-700 hover:bg-islamic-100'
                }`}
              >
                <SafeIcon icon={FiHome} className="text-lg" />
                <span className="font-medium">Home</span>
              </Link>
              
              <Link 
                to="/admin/login" 
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-islamic-700 hover:bg-islamic-100 transition-colors"
              >
                <SafeIcon icon={FiSettings} className="text-lg" />
                <span className="font-medium">Admin</span>
              </Link>
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
      
      <OfflineIndicator />
    </div>
  );
};

export default Layout;