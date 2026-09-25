// Toppo: los avisos en el dispositivo.
//
// Este fichero lo instala el navegador aparte de la aplicación, y es lo que
// permite que un aviso aparezca con Toppo cerrado. Hace dos cosas y nada más:
// enseñar el aviso y abrir Toppo al tocarlo.
//
// NO guarda nada en caché a propósito. Un service worker que cachea sirve la
// versión vieja de la aplicación después de publicar una nueva, y el usuario
// no tiene forma de saber por qué no ve los cambios.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch (fallo) {
    datos = { cuerpo: evento.data ? evento.data.text() : '' };
  }

  // Un aviso sin contenido es el de prueba del botón "Probar". Hay que enseñar
  // algo SIEMPRE: Safari retira el permiso a la web que recibe un aviso y no
  // lo muestra.
  const titulo = datos.titulo || 'Toppo';
  const opciones = {
    body: datos.cuerpo || 'Los avisos de Toppo funcionan en este dispositivo.',
    icon: './icono-192-v2.png',
    // La insignia de la barra de Android va en blanco sobre transparente:
    // Android la pinta de un solo color, y con el icono a color salía un
    // cuadrado negro.
    badge: './icono-aviso.png',
    lang: 'es-ES',
    data: { url: datos.url || './' },
  };
  // La misma etiqueta reemplaza al aviso anterior en vez de apilar dos iguales.
  if (datos.etiqueta) opciones.tag = datos.etiqueta;

  evento.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = new URL(
    (evento.notification.data && evento.notification.data.url) || './',
    self.registration.scope,
  ).href;

  evento.waitUntil((async () => {
    // Si Toppo ya está abierto, se usa esa ventana en vez de abrir otra.
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const ventana of ventanas) {
      if (ventana.url.startsWith(self.registration.scope) && 'focus' in ventana) {
        await ventana.focus();
        if ('navigate' in ventana) await ventana.navigate(destino);
        return;
      }
    }
    await self.clients.openWindow(destino);
  })());
});
