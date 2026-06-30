import { Capacitor } from '@capacitor/core';
import { notificationsService } from '../services/notifications.service';

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = () =>
  FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'your-api-key';

async function registerTokenWithBackend(token, platform) {
  try {
    await notificationsService.registerToken(token, platform);
  } catch {
    // Non-fatal — token registration failures shouldn't break the app
  }
}

async function initNativePush() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async ({ value: token }) => {
    await registerTokenWithBackend(token, Capacitor.getPlatform());
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.warn('Push registration error:', err);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Foreground notification — app is open
    // The in-app Toast handler can pick this up via a custom event
    window.dispatchEvent(new CustomEvent('solarhub:push', { detail: notification }));
  });

  PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    // User tapped notification when app was backgrounded
    const url = notification.data?.url;
    if (url) window.location.href = url;
  });
}

async function initWebPush() {
  if (!isFirebaseConfigured()) return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (token) await registerTokenWithBackend(token, 'web');

    onMessage(messaging, (payload) => {
      window.dispatchEvent(new CustomEvent('solarhub:push', { detail: payload }));
    });
  } catch (err) {
    console.warn('Web push setup failed:', err.message);
  }
}

export async function initPushNotifications() {
  try {
    if (Capacitor.isNativePlatform()) {
      await initNativePush();
    } else {
      await initWebPush();
    }
  } catch (err) {
    console.warn('Push notification init failed:', err.message);
  }
}

export async function deregisterPushToken() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.removeAllListeners();
    } else if (isFirebaseConfigured()) {
      const { getApps } = await import('firebase/app');
      const { getMessaging, getToken, deleteToken } = await import('firebase/messaging');
      const apps = getApps();
      if (!apps.length) return;
      const messaging = getMessaging(apps[0]);
      const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
      if (token) {
        await notificationsService.unregisterToken(token);
        await deleteToken(messaging);
      }
    }
  } catch {
    // Non-fatal
  }
}
