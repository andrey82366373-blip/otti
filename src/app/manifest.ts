import type { MetadataRoute } from "next";

/** Описание приложения для установки на телефон или компьютер (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Otti — английский с ИИ-репетитором",
    short_name: "Otti",
    description: "Короткие уроки английского от A1 до B2 и ИИ-репетитор, который объясняет ошибки по-русски.",
    lang: "ru",
    start_url: "/learn",
    scope: "/",
    display: "standalone",
    background_color: "#f6f6fb",
    theme_color: "#f6f6fb",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
