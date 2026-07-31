/* =======================================================
   SERVICE WORKER: SUPORTE OFFLINE PARA O AFINADOR PWA
   ======================================================= */

const CACHE_NAME = 'afinador-v1';
// Lista de arquivos necessários para o app rodar sem internet
const ARCHIVOS_CACHE = [
    './',
    './index.html',
    './style.css',
    './tuner.js',
    './manifest.json'
];

// 1. Instalação: Guarda todos os arquivos no cache do dispositivo
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Arquivos do Afinador guardados em cache!');
            return cache.addAll(ARCHIVOS_CACHE);
        })
    );
});

// 2. Interceção de Rede: Se estiver offline, entrega os arquivos guardados
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Retorna o arquivo do cache se existir; caso contrário, busca na rede
            return response || fetch(event.request);
        })
    );
});
