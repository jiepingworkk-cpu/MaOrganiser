import { NextResponse } from "next/server";

const SW_VERSION = "10.14.1";

/**
 * ให้ Service Worker สำหรับ Firebase Cloud Messaging (ใช้ push notification)
 * ไฟล์นี้ถูกสร้างจาก env เพื่อไม่ให้ต้องกรอก Firebase config 2 ที่
 */
export function GET() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const js = `
importScripts("https://www.gstatic.com/firebasejs/${SW_VERSION}/firebase-messaging-sw.js");

firebase.initializeApp(${JSON.stringify(cfg)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var data = (payload && payload.data) || {};
  var title = data.title || "Organiser";
  var body = data.body || "";
  return self.registration.showNotification(title, {
    body: body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: data.url || "/" },
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) {
          list[i].focus();
          list[i].navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
`.trim();

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "Service-Worker-Allowed": "/",
    },
  });
}