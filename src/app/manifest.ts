import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BILLORA",
    short_name: "BILLORA",
    description: "Billing and inventory for your counter.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#087747",
    theme_color: "#087747",
    icons: [
      { src: "/icons/billora-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/billora-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
