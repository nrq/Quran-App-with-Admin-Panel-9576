import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Offline cache utility for mobile platforms
 * Uses Capacitor Filesystem for native platforms and localStorage for web
 */
export class OfflineCache {
  static CACHE_DIR = 'quran-cache';
  static AUDIO_DIR = 'quran-audio';

  /**
   * Check if running on native platform
   */
  static isNative() {
    return Capacitor.isNativePlatform();
  }

  /**
   * Save data to cache
   */
  static async saveData(key, data) {
    try {
      const jsonData = JSON.stringify(data);
      
      if (this.isNative()) {
        await Filesystem.writeFile({
          path: `${this.CACHE_DIR}/${key}.json`,
          data: jsonData,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
      } else {
        localStorage.setItem(`cache_${key}`, jsonData);
      }
      
      console.log(`Data cached: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error caching data for ${key}:`, error);
      return false;
    }
  }

  /**
   * Load data from cache
   */
  static async loadData(key) {
    try {
      if (this.isNative()) {
        const result = await Filesystem.readFile({
          path: `${this.CACHE_DIR}/${key}.json`,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
        return JSON.parse(result.data);
      } else {
        const data = localStorage.getItem(`cache_${key}`);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error(`Error loading cached data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if data exists in cache
   */
  static async hasData(key) {
    try {
      if (this.isNative()) {
        await Filesystem.stat({
          path: `${this.CACHE_DIR}/${key}.json`,
          directory: Directory.Data
        });
        return true;
      } else {
        return localStorage.getItem(`cache_${key}`) !== null;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete cached data
   */
  static async deleteData(key) {
    try {
      if (this.isNative()) {
        await Filesystem.deleteFile({
          path: `${this.CACHE_DIR}/${key}.json`,
          directory: Directory.Data
        });
      } else {
        localStorage.removeItem(`cache_${key}`);
      }
      console.log(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error deleting cache for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  static async clearAll() {
    try {
      if (this.isNative()) {
        // Delete cache directory
        await Filesystem.rmdir({
          path: this.CACHE_DIR,
          directory: Directory.Data,
          recursive: true
        });
        // Recreate empty directory
        await Filesystem.mkdir({
          path: this.CACHE_DIR,
          directory: Directory.Data,
          recursive: true
        });
      } else {
        // Clear all cache items from localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            localStorage.removeItem(key);
          }
        });
      }
      console.log('All cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache size (approximate)
   */
  static async getCacheSize() {
    try {
      if (this.isNative()) {
        // For native, we'd need to iterate through files
        // This is a simplified version
        return 'N/A';
      } else {
        let size = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            size += localStorage.getItem(key).length;
          }
        });
        return `${(size / 1024).toFixed(2)} KB`;
      }
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 'Error';
    }
  }

  /**
   * Initialize cache directories (for native platforms)
   */
  static async initialize() {
    if (!this.isNative()) return;

    try {
      // Create cache directory if it doesn't exist
      await Filesystem.mkdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
        recursive: true
      });

      // Create audio cache directory
      await Filesystem.mkdir({
        path: this.AUDIO_DIR,
        directory: Directory.Data,
        recursive: true
      });

      console.log('Cache directories initialized');
    } catch (error) {
      // Directory might already exist, which is fine
      console.log('Cache directories already exist or error:', error);
    }
  }

  /**
   * Cache audio file
   */
  static async cacheAudio(url, filename) {
    if (!this.isNative()) {
      // For web, rely on service worker caching
      return url;
    }

    try {
      // Check if already cached
      const cachedPath = `${this.AUDIO_DIR}/${filename}`;
      try {
        await Filesystem.stat({
          path: cachedPath,
          directory: Directory.Data
        });
        // File exists, return local path
        const uri = await Filesystem.getUri({
          path: cachedPath,
          directory: Directory.Data
        });
        return uri.uri;
      } catch {
        // File doesn't exist, download it
      }

      // Download and cache the audio file
      const response = await fetch(url);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      await Filesystem.writeFile({
        path: cachedPath,
        data: base64Data,
        directory: Directory.Data
      });

      const uri = await Filesystem.getUri({
        path: cachedPath,
        directory: Directory.Data
      });

      console.log(`Audio cached: ${filename}`);
      return uri.uri;
    } catch (error) {
      console.error(`Error caching audio ${filename}:`, error);
      return url; // Fallback to original URL
    }
  }

  /**
   * Convert blob to base64
   */
  static blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Initialize cache on module load
OfflineCache.initialize();
