import type { MetadataRoute } from "next";
import { FEATURES } from "@/lib/config/features";

export default function manifest(): MetadataRoute.Manifest | null {
  if (!FEATURES.pwa) {
    return null;
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Boilerplate Platform";
  const appShortName = process.env.NEXT_PUBLIC_APP_SHORT_NAME || "Boilerplate";

  return {
    name: appName,
    short_name: appShortName,
    description: "SaaS Multi-tenant Boilerplate Platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#10b981",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
