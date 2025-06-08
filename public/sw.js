const CACHE_NAME = 'neurodiversity-support-ai-v5';
// 事前キャッシュは同一オリジンのリソースのみに限定
const urlsToCache = [
    '/images/niuniu.png',
    '/images/setting.png',
    '/images/pattern1.png',
    '/images/pattern2.png',
    '/images/pattern3.png',
    '/images/pattern4.png',
    '/images/pattern5.png',
    '/images/pattern6.png',
    '/images/pattern7.png',
    '/images/pattern8.png',
    '/images/pattern9.png',
    '/images/pattern10.png',
    '/images/pattern11.png',
    '/images/pattern12.png',
    '/images/pattern13.png',
    '/images/pattern14.png',
    '/images/pattern15.png',
    '/images/pattern16.png',
    '/images/pattern17.png',
    '/images/pattern18.png',
    '/images/pattern19.png',
    '/images/pattern20.png',
    '/images/pattern21.png',
    '/images/pattern22.png',
    '/images/pattern23.png',
    '/images/pattern24.png',
    '/images/pattern25.png',
    '/images/pattern26.png',
    '/images/pattern27.png',
];

// 外部リソース用の別キャッシュ名
const EXTERNAL_CACHE_NAME = 'external-resources-v5';

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('キャッシュを開いています');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('キャッシュの作成に失敗しました:', error);
            })
    );
});

// フェッチ時にキャッシュからレスポンスを返す
self.addEventListener('fetch', (event) => {
    // HTTPSリクエストのみを処理（chrome-extension:// などは除外）
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // 外部リソースかどうかを判定
    const isExternal = !event.request.url.startsWith(self.location.origin);
    const cacheName = isExternal ? EXTERNAL_CACHE_NAME : CACHE_NAME;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュにある場合はそれを返す
                if (response) {
                    return response;
                }

                // キャッシュにない場合はネットワークから取得
                return fetch(event.request)
                    .then((response) => {
                        // レスポンスが無効な場合はそのまま返す
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // 外部リソースの場合はopaque responseを許可
                        if (isExternal && response.type === 'opaque') {
                            // opaqueレスポンスはクローンしてキャッシュに保存
                            const responseToCache = response.clone();
                            caches.open(cacheName)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch((error) => {
                                    console.warn('外部リソースのキャッシュに失敗:', error);
                                });
                            return response;
                        }

                        // 同一オリジンリソースの通常処理
                        if (response.type === 'basic') {
                            const responseToCache = response.clone();
                            caches.open(cacheName)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch((error) => {
                                    console.warn('リソースのキャッシュに失敗:', error);
                                });
                        }

                        return response;
                    })
                    .catch(() => {
                        // オフライン時の処理
                        if (event.request.destination === 'document') {
                            return caches.match('/');
                        }
                    });
            })
    );
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME, EXTERNAL_CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('古いキャッシュを削除します:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
