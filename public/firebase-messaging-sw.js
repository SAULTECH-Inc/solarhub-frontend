// Firebase Messaging Service Worker — handles background push notifications
// This file must be at exactly /firebase-messaging-sw.js (Firebase requirement)
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Config is duplicated here because service workers can't access Vite env vars.
// Update these values when you set up your Firebase project.
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.FIREBASE_PROJECT_ID         || '',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             self.FIREBASE_APP_ID             || '',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title   = payload.notification?.title || 'Solar Maket';
  const options = {
    body:  payload.notification?.body || 'You have a new notification',
    icon:  '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data:  payload.data || {},
    tag:   payload.data?.tag || 'solarmaket-notification',
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
