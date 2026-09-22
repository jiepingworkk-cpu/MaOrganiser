import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Organiser — จัดชีวิตคนเดียวจบ",
    short_name: "Organiser",
    description:
      "ปฏิทิน งาน โน้ต ติดตามอ่านหนังสือ และนับถอยหลังวันสำคัญ ซิงก์ทุกอุปกรณ์ฟรี",
    lang: "th",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#0f172a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}