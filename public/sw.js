self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated");
});

self.addEventListener("push", (event) => {
  const data = event.data?.json();

  self.registration.showNotification(data.title || "RISE", {
    body: data.body,
    icon: "/manifest-icon-192.png",
    badge: "/manifest-icon-192.png",
  });
});
