/*
 * 情緒花園 Service Worker
 *
 * 快取策略（不會擋住更新）：
 *  - 網頁本身（HTML）：網路優先，且每次都向伺服器重新驗證（cache: 'no-cache'）。
 *    只有離線時才使用快取的版本，所以你推送新版本後，使用者下次開啟就會拿到新版。
 *  - 程式碼與樣式（js/ 的 .js、css/ 的 .css）：同樣網路優先、每次向伺服器重新驗證，離線才用快取。
 *    這樣 index.html 與各個 js、css 檔永遠是同一個版本，不會出現「新網頁配舊程式／舊樣式」的混搭。
 *  - 圖示、字型、Three.js 等其他檔案：先用快取（速度快、可離線），
 *    同時在背景更新，下次開啟就是最新的。
 *  - 新的 service worker 會立刻接手（skipWaiting + clients.claim），舊快取會自動清除。
 *
 * 一般更新網頁內容時，不需要改這個檔案。
 * 只有在你換了圖示或想強制清空所有舊快取時，才把 VERSION 改成新的值。
 */
const VERSION = 'v5.2.0';
const CACHE = 'mood-garden-' + VERSION;

// 預先快取的檔案（相對於本檔案所在的資料夾）。任何一個找不到也不會讓安裝失敗。
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vendor/three.r128.min.js',
  // 樣式
  './css/base.css',
  './css/hud.css',
  './css/panel.css',
  './css/components.css',
  './css/modal.css',
  './css/card-toast.css',
  './css/onboarding.css',
  './css/icons-touch.css',
  './css/loader.css',
  './css/settings.css',
  './css/sync-gifts.css',
  './css/gift-dex.css',
  './css/bottom-buttons.css',
  './css/sleep.css',
  './css/liquid-glass.css',
  './css/quality.css',
  // 程式碼：新增或改名 js／css 檔時，記得同步更新這份清單（沒列到也能運作，只是第一次離線開啟會缺檔）
  './js/log.js',
  './js/audio.js',
  './js/state.js',
  './js/icons.js',
  './js/i18n.js',
  './js/locales/en.js',
  './js/locales/zh.js',
  './js/locales/ja.js',
  './js/locales/ko.js',
  './js/world.js',
  './js/three-utils.js',
  './js/flowers.js',
  './js/flower-care.js',
  './js/garden-scene.js',
  './js/camera.js',
  './js/creatures.js',
  './js/weather.js',
  './js/particles.js',
  './js/gifts.js',
  './js/loop.js',
  './js/input.js',
  './js/ui-shell.js',
  './js/views.js',
  './js/boot.js',
  './js/skin.js',
  './js/cloud.js',
  './js/river.js',
  './js/memory.js',
  './js/withered-island.js',
  './js/wish.js',
  './js/animal-home.js',
  './js/pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, {
        cache: 'reload'
      }))))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('mood-garden-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
  // 自己網站的程式碼與樣式（/js/*.js、/css/*.css）：網路優先，確保跟 index.html 同一版
  const u = new URL(req.url);
  if (u.origin === self.location.origin && /\/(js|css)\/.+\.(js|css)$/.test(u.pathname)) {
    event.respondWith(networkFirstAsset(req));
    return;
  }
  event.respondWith(staleWhileRevalidate(event, req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, {
      cache: 'no-cache'
    });
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (
      (await cache.match(req)) ||
      (await cache.match('./index.html')) ||
      (await cache.match('./')) ||
      Response.error()
    );
  }
}

async function networkFirstAsset(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, {
      cache: 'no-cache'
    });
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req)) || Response.error();
  }
}

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  if (hit) {
    event.waitUntil(network.catch(() => {}));
    return hit;
  }
  return network;
}
