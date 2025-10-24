import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { getTotalVersesCount } from '../data/quran-data';
import { db } from '../lib/firebase';
import { onSnapshot, collection } from 'firebase/firestore';

const { FiWifi, FiWifiOff, FiCheck, FiCloud, FiCloudOff } = FiIcons;

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [totalVerses, setTotalVerses] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test offline data loading
    const testOfflineData = async () => {
      try {
        const count = await getTotalVersesCount();
        setTotalVerses(count);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    };

    testOfflineData();

    // Monitor Firestore connection status
    // We'll use a simple snapshot listener to detect connectivity
    let unsubscribe = null;
    try {
      const testCollection = collection(db, 'custom_urls');
      unsubscribe = onSnapshot(
        testCollection,
        { includeMetadataChanges: true },
        (snapshot) => {
          // Check if data is from cache (offline) or server (online)
          const isFromCache = snapshot.metadata.fromCache;
          setFirestoreConnected(!isFromCache);
        },
        (error) => {
          // If there's an error, assume we're offline
          console.warn('Firestore connection error:', error);
          setFirestoreConnected(false);
        }
      );
    } catch (error) {
      console.warn('Could not set up Firestore connection monitor:', error);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Determine the status and color
  const getStatus = () => {
    if (!dataLoaded) {
      return { color: 'bg-yellow-500', icon: FiWifi, text: 'Loading...' };
    }
    
    if (!isOnline) {
      return { 
        color: 'bg-orange-500', 
        icon: FiWifiOff, 
        text: `Offline Mode (${totalVerses.toLocaleString()} verses cached)` 
      };
    }
    
    if (!firestoreConnected) {
      return { 
        color: 'bg-blue-500', 
        icon: FiCloudOff, 
        text: `Local Mode (${totalVerses.toLocaleString()} verses)` 
      };
    }
    
    return { 
      color: 'bg-green-500', 
      icon: FiCloud, 
      text: `Online & Synced (${totalVerses.toLocaleString()} verses)` 
    };
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${status.color} text-white`}>
        <SafeIcon icon={status.icon} />
        <span className="text-sm font-medium">
          {status.text}
        </span>
      </div>
    </motion.div>
  );
};

export default OfflineIndicator;