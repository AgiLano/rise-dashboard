self.addEventListener("install", () => {
  console.log("Service Worker Installed");
});

self.addEventListener("activate", () => {
  console.log("Service Worker Activated");
});

self.addEventListener("push", (event) => {
  let title = "📈 RISE";
  let body = "Signal baru tersedia";

  try {
    const data = event.data?.json();

    title = data?.title || "📈 RISE";
    body = data?.body || "Signal baru tersedia";
  } catch {
    body = event.data?.text() || "Signal baru tersedia";
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/manifest-icon-192.png",
      badge: "/manifest-icon-192.png",
      tag: "rise-signal",
      renotify: true,
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }

        return clients.openWindow("https://ritelsociety-dashboard.vercel.app");
      }),
  );
});
