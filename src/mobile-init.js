import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';

export const initializeMobileApp = async () => {
  if (!Capacitor.isNativePlatform()) {
    return; // Web platform, no mobile initialization needed
  }

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Hide splash screen after app is ready
    await SplashScreen.hide();

    // Set up network monitoring
    Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed', status);
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('networkStatusChange', { 
        detail: status 
      }));
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
    });

    // Handle deep links (if needed)
    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data);
      // You can handle deep linking here if needed
      // For example, navigate to specific routes based on the URL
    });

    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.error('Error initializing mobile app:', error);
  }
};
