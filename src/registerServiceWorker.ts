// Service Worker Registration for Aswaq Qalat Sukkar PWA

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ PWA Service Worker registered successfully with scope:', registration.scope);

          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('🔄 New PWA update available.');
                  } else {
                    console.log('📱 PWA is ready for offline usage.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    });
  }
}
