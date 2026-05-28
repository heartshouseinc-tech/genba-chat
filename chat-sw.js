// 現場チャット Service Worker - 通知対応版
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCVk2miG5TK1ffTofXLh0hHgeSbOvmIgZ8",
  authDomain: "kensetsu-nippo-842a2.firebaseapp.com",
  projectId: "kensetsu-nippo-842a2",
  storageBucket: "kensetsu-nippo-842a2.firebasestorage.app",
  messagingSenderId: "702880974315",
  appId: "1:702880974315:web:985321dc9180046629c5ae"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// バックグラウンド通知受信
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || '現場チャット', {
    body: body || '新しいメッセージが届きました',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'genba-chat-' + Date.now(),
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '開く' },
      { action: 'close', title: '閉じる' }
    ]
  });
});

// 通知タップで開く
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if(e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      if(cs.length > 0){ cs[0].focus(); return; }
      return clients.openWindow('./chat.html');
    })
  );
});

// キャッシュ
const CACHE = 'genba-chat-v2';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./chat.html','./chat-manifest.json']).catch(()=>{}))
    .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if(e.request.url.includes('firebase') || e.request.url.includes('googleapis')) return;
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if(res && res.status === 200) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => null);
      return cached || net;
    })
  );
});
