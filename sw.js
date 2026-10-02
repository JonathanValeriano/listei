// Service Worker do Listei — permite abrir e usar o app mesmo sem internet
// (útil dentro do mercado, onde o sinal costuma ser fraco), depois da primeira visita.
//
// Estratégia: "network-first" — sempre tenta buscar a versão mais nova na rede
// (importante porque o app é atualizado com frequência); se a rede falhar,
// cai pro que estiver salvo em cache. Assim o usuário nunca fica "preso" numa
// versão antiga enquanto está online, mas o app continua funcionando offline.

const CACHE_NAME = "listei-cache-v1";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => cached || caches.match("./index.html"))
      )
  );
});
