importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCFt_h5eY9_sltuseNkQ5RPaJghSrBqwlU',
  authDomain: 'beyomo-2f613.firebaseapp.com',
  projectId: 'beyomo-2f613',
  storageBucket: 'beyomo-2f613.firebasestorage.app',
  messagingSenderId: '877628130035',
  appId: '1:877628130035:web:3f21ef309928327b23ad86',
});

const firebaseMessaging = firebase.messaging();

firebaseMessaging.onBackgroundMessage(payload => {
  const { title = 'Beyomo', body = '' } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });
});
