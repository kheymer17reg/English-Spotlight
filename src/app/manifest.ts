import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spotlight Learning",
    short_name: "Spotlight",
    description:
      "Английский 2-8 класс · AI-помощник Lumos, словарь, чтение, произношение, журнал",
    start_url: "/student",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b17",
    theme_color: "#6366f1",
    lang: "ru",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Словарь",
        short_name: "Словарь",
        url: "/student/vocabulary",
      },
      {
        name: "Чтение",
        short_name: "Чтение",
        url: "/student/reading",
      },
      {
        name: "Ошибки на повтор",
        short_name: "Ошибки",
        url: "/student/mistakes",
      },
      {
        name: "Lumos чат",
        short_name: "Lumos",
        url: "/student/chat",
      },
    ],
    categories: ["education", "productivity", "kids"],
  };
}
