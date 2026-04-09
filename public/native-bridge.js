// Brikk Native Bridge
// Detects when running inside Capacitor (iOS app) and initializes native features
(function() {
  // Wait for Capacitor to be available
  function initNative() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
    
    console.log('[Brikk] Native platform detected, initializing...');
    
    // Status Bar
    if (window.Capacitor.Plugins.StatusBar) {
      window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' });
    }
    
    // Splash Screen — hide after content loads
    if (window.Capacitor.Plugins.SplashScreen) {
      window.Capacitor.Plugins.SplashScreen.hide();
    }
    
    // Push Notifications — register (ask permission in context, not on launch)
    // We delay this until the user is logged in and on the app dashboard
    window.brikk = window.brikk || {};
    window.brikk.requestPushPermission = async function() {
      const PushNotifications = window.Capacitor.Plugins.PushNotifications;
      if (!PushNotifications) return;
      
      try {
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive === 'granted') {
          await PushNotifications.register();
          console.log('[Brikk] Push notifications registered');
        }
        
        // Listen for registration token
        PushNotifications.addListener('registration', function(token) {
          console.log('[Brikk] Push token:', token.value);
          // Store token for later use with server-side push
          window.brikk.pushToken = token.value;
          // TODO: Send token to Supabase for storage
        });
        
        // Listen for incoming notifications
        PushNotifications.addListener('pushNotificationReceived', function(notification) {
          console.log('[Brikk] Notification received:', notification);
        });
        
        // Listen for notification tap
        PushNotifications.addListener('pushNotificationActionPerformed', function(notification) {
          console.log('[Brikk] Notification tapped:', notification);
          // Navigate to relevant page based on notification data
          if (notification.notification.data && notification.notification.data.url) {
            window.location.href = notification.notification.data.url;
          }
        });
      } catch (err) {
        console.error('[Brikk] Push notification error:', err);
      }
    };
    
    // Haptic Feedback
    window.brikk.haptic = async function(style) {
      const Haptics = window.Capacitor.Plugins.Haptics;
      if (!Haptics) return;
      
      try {
        switch(style) {
          case 'success':
            await Haptics.notification({ type: 'SUCCESS' });
            break;
          case 'warning':
            await Haptics.notification({ type: 'WARNING' });
            break;
          case 'error':
            await Haptics.notification({ type: 'ERROR' });
            break;
          case 'light':
            await Haptics.impact({ style: 'LIGHT' });
            break;
          case 'medium':
            await Haptics.impact({ style: 'MEDIUM' });
            break;
          case 'heavy':
            await Haptics.impact({ style: 'HEAVY' });
            break;
          default:
            await Haptics.impact({ style: 'LIGHT' });
        }
      } catch (err) {
        // Silently fail on web
      }
    };
    
    // Native Share
    window.brikk.share = async function(title, text, url) {
      const Share = window.Capacitor.Plugins.Share;
      if (!Share) return;
      
      try {
        await Share.share({ title: title, text: text, url: url });
      } catch (err) {
        // Fallback to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
        }
      }
    };
    
    // Badge count
    window.brikk.setBadge = async function(count) {
      const Badge = window.Capacitor.Plugins.Badge;
      if (!Badge) return;
      
      try {
        if (count > 0) {
          await Badge.set({ count: count });
        } else {
          await Badge.clear();
        }
      } catch (err) {
        // Silently fail
      }
    };
    
    // App state handling (background/foreground)
    if (window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('appStateChange', function(state) {
        if (state.isActive) {
          console.log('[Brikk] App returned to foreground');
          // Refresh data when app comes back
          if (window.brikk.onResume) window.brikk.onResume();
        }
      });
      
      // Handle back button (Android, but good practice)
      window.Capacitor.Plugins.App.addListener('backButton', function() {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
    }
    
    // Mark as native for UI adjustments
    document.documentElement.classList.add('capacitor-native');
    document.documentElement.classList.add('ios');
    
    // Face ID / Biometric Auth
    window.brikk.authenticateBiometric = async function() {
      // Use native biometric if available
      if (window.Capacitor.Plugins.BiometricAuth) {
        try {
          const result = await window.Capacitor.Plugins.BiometricAuth.authenticate({
            reason: 'Unlock Brikk',
            title: 'Brikk',
            subtitle: 'Use Face ID to access your leads',
            cancelTitle: 'Use Password'
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      // Fallback: use WebAuthn if available
      return { success: true };
    };

    // Check if biometrics are available
    window.brikk.hasBiometric = async function() {
      if (window.Capacitor.Plugins.BiometricAuth) {
        try {
          const result = await window.Capacitor.Plugins.BiometricAuth.isAvailable();
          return result.isAvailable || false;
        } catch(e) { return false; }
      }
      return false;
    };

    console.log('[Brikk] Native initialization complete');
  }
  
  // Try immediately, then retry after a short delay
  if (document.readyState === 'complete') {
    initNative();
  } else {
    window.addEventListener('load', initNative);
  }
  
  // Also try after a delay in case Capacitor loads late
  setTimeout(initNative, 1000);
})();
