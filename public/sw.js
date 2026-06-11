self.addEventListener("install", () => {
  console.log("Service Worker Installed");
});

self.addEventListener("activate", () => {
  console.log("Service Worker Activated");
});

self.addEventListener("push", (event) => {
  console.log("PUSH RECEIVED");

  let title = "📈 RISE";
  let body = "Signal baru tersedia";

  try {
    const data = event.data?.json();

    console.log("PUSH DATA:", data);

    title = data?.title || "📈 RISE";
    body = data?.body || "Signal baru tersedia";
  } catch (error) {
    console.log("PUSH TEXT");

    body = event.data?.text() || "Signal baru tersedia";
  }

  event.waitUntil(
    self.registration
      .showNotification(title, {
        body,
        icon: "/manifest-icon-192.png",
        badge: "/manifest-icon-192.png",
        tag: "rise-signal",
        renotify: true,
        requireInteraction: true,

        data: {
          signalId: data?.signalId || null,
        },
      })
      .then(() => {
        console.log("🔥 NOTIFICATION SHOWN");
      })
      .catch((error) => {
        console.error("❌ NOTIFICATION ERROR", error);
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("NOTIFICATION CLICKED");

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

        const signalId = event.notification.data?.signalId;

        return clients.openWindow(
          signalId
            ? `https://ritelsociety-dashboard.vercel.app/?signal=${signalId}`
            : "https://ritelsociety-dashboard.vercel.app",
        );
      }),
  );
});
