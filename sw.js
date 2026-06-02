self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const titulo = data.titulo || 'VYNTRA';
  const cuerpo = data.cuerpo || '';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      // Si el panel está abierto, enviarle un mensaje directo (toast in-panel)
      cls.forEach(c => c.postMessage({ type: 'PUSH_TOAST', titulo, cuerpo }));
      // Mostrar notificación del sistema siempre
      return self.registration.showNotification(titulo, {
        body: cuerpo,
        tag: data.tag || 'vyntra',
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: self.location.origin + '/vyntra-panel/' }
      });
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cls => {
      const url = e.notification.data?.url || '/';
      const abierto = cls.find(c => c.url.includes('vyntra-panel'));
      if (abierto) return abierto.focus();
      return clients.openWindow(url);
    })
  );
});
