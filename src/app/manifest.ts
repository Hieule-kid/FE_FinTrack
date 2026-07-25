import type { MetadataRoute } from "next";
import { env } from "@/config/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.appName,
    short_name: env.appName,
    description: "Financial planning and savings goals tracker",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eff3ff",
    theme_color: "#2158d8",
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
