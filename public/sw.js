self.addEventListener('install', function(e) {
    e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.map(function(name) {
                    return caches.delete(name);
                })
            );
        }).then(function() {
            return self.registration.unregister();
        }).then(function() {
            return self.clients.matchAll({ type: 'window' });
        }).then(function(clients) {
            clients.forEach(function(client) {
                client.navigate(client.url);
            });
        })
    );
});
