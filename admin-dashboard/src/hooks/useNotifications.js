import { useEffect, useCallback } from 'react';
import { messaging, getToken, onMessage, VAPID_KEY } from '../firebase';
import api from '../services/api';

export function useNotifications(user) {
  const registerToken = useCallback(async () => {
    if (!user) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
      if (token) {
        await api.patch('/api/v1/admin/me/device-token', { fcmToken: token });
      }
    } catch (err) {
      console.error('FCM registration error:', err);
    }
  }, [user]);

  useEffect(() => {
    registerToken();
  }, [registerToken]);

  useEffect(() => {
    if (!user) return;

    const unsub = onMessage(messaging, payload => {
      const { title = 'Beyomo', body = '' } = payload.notification ?? {};
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    });

    return () => unsub();
  }, [user]);
}
