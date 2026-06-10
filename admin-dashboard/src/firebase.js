import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyCFt_h5eY9_sltuseNkQ5RPaJghSrBqwlU',
  authDomain: 'beyomo-2f613.firebaseapp.com',
  projectId: 'beyomo-2f613',
  storageBucket: 'beyomo-2f613.firebasestorage.app',
  messagingSenderId: '877628130035',
  appId: '1:877628130035:web:3f21ef309928327b23ad86',
  measurementId: 'G-CNKRX0B70T',
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export { getToken, onMessage };
export const VAPID_KEY = 'BHsdFtcK94P6Yam5LZHWNzOeGGpBFgFHQG3yCxfc-NKUsV5W52t5kd0XsqS-JTSEuSDQuI0HR4OVF8VqMtU_JH0';
