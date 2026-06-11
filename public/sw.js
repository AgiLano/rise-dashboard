self.addEventListener("push", (event) => {
  let title = "RISE";
  let body = "Push Notification Test";

  try {
    const data = event.data?.json();

    title = data.title || "RISE";
    body = data.body || "Push Notification Test";
  } catch {
    body = event.data?.text() || "Push Notification Test";
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/manifest-icon-192.png",
      badge: "/manifest-icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
