import { Capacitor } from '@capacitor/core';

export class MobileErrorHandler {
  static async showError(title, message) {
    if (Capacitor.isNativePlatform()) {
      // For native platforms, use native alert
      // Note: @capacitor/dialog is optional, using window.alert as fallback
      try {
        const { Dialog } = await import('@capacitor/dialog');
        await Dialog.alert({
          title: title,
          message: message
        });
      } catch (error) {
        // Fallback to standard alert if Dialog plugin not available
        alert(`${title}: ${message}`);
      }
    } else {
      // Fallback to web alert or toast
      alert(`${title}: ${message}`);
    }
  }

  static async showConfirm(title, message) {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Dialog } = await import('@capacitor/dialog');
        const result = await Dialog.confirm({
          title: title,
          message: message
        });
        return result.value;
      } catch (error) {
        // Fallback to standard confirm
        return confirm(`${title}: ${message}`);
      }
    } else {
      return confirm(`${title}: ${message}`);
    }
  }

  static handleNetworkError(error) {
    console.error('Network error:', error);
    this.showError(
      'Connection Error',
      'Unable to connect. Please check your internet connection.'
    );
  }

  static handleStorageError(error) {
    console.error('Storage error:', error);
    this.showError(
      'Storage Error',
      'Unable to save data. Please check device storage.'
    );
  }

  static handleAuthError(error) {
    console.error('Authentication error:', error);
    let message = 'An authentication error occurred.';
    
    // Provide user-friendly messages for common auth errors
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address.';
    } else if (error.code === 'auth/user-disabled') {
      message = 'This account has been disabled.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later.';
    } else if (error.message) {
      message = error.message;
    }
    
    this.showError('Authentication Error', message);
  }

  static handleFirestoreError(error) {
    console.error('Firestore error:', error);
    let message = 'An error occurred while accessing data.';
    
    if (error.code === 'permission-denied') {
      message = 'You do not have permission to access this data.';
    } else if (error.code === 'unavailable') {
      message = 'Service temporarily unavailable. Please try again.';
    } else if (error.message) {
      message = error.message;
    }
    
    this.showError('Data Error', message);
  }
}
