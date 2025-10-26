import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const { FiLock, FiUser } = FiIcons;

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/admin" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(username, password);
      if (!success) {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-50 to-islamic-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-islamic-gold to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={FiLock} className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-islamic-800">Admin Login</h1>
          <p className="text-islamic-600 mt-2">Access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-islamic-700 mb-2">
              Email
            </label>
            <div className="relative">
              <SafeIcon
                icon={FiUser}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-islamic-400"
              />
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none transition-all"
                placeholder="Enter email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-islamic-700 mb-2">
              Password
            </label>
            <div className="relative">
              <SafeIcon
                icon={FiLock}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-islamic-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-islamic-200 rounded-lg focus:ring-2 focus:ring-islamic-gold focus:border-transparent outline-none transition-all"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-islamic-gold to-yellow-600 text-white py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-islamic-gold transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <Link
          to="/"
          className="mt-6 inline-flex w-full items-center justify-center space-x-2 border border-islamic-200 text-islamic-700 py-2.5 rounded-lg hover:bg-islamic-50 transition-colors"
        >
          <span>Go Back</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default AdminLogin;