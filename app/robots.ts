import type { MetadataRoute } from "next";
import { SITE_URL } from "constants/site";

/**
 * Crawlers may read the public pages and are pointed at the sitemap. The
 * pages behind the login redirect to /signin anyway; listing them here only
 * saves crawlers the trip.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/LMS/", "/api/", "/signin", "/judge/", "/lti/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
