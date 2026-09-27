import type { MetadataRoute } from "next";

/** Поисковикам можно показывать главную; служебные адреса — нет. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/status", "/offline.html"] },
  };
}
