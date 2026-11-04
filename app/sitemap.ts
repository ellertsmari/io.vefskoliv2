import type { MetadataRoute } from "next";
import { SITE_URL } from "constants/site";
import { getPublicGuides } from "serverActions/getPublicGuides";
import { getPublicBriefs } from "serverActions/groups/getPublicBriefs";
import { isoDate } from "utils/serialization";

// Read from the database on each request rather than frozen at build time,
// so a guide published today is in tomorrow's crawl without a redeploy.
export const dynamic = "force-dynamic";

const EPOCH = new Date(0).toISOString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [guides, briefs] = await Promise.all([
    getPublicGuides().then((list) => list ?? []),
    getPublicBriefs(),
  ]);
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/guides`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/showcase`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/projects`, changeFrequency: "monthly", priority: 0.8 },
    ...guides.map((guide) => {
      // Hand-imported guides may have no usable date; leave lastmod out
      // rather than claim 1970.
      const updated = isoDate(guide.updatedAt ?? guide.createdAt);
      return {
        url: `${SITE_URL}/guides/${String(guide._id)}`,
        ...(updated !== EPOCH ? { lastModified: updated } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      };
    }),
    ...briefs.map(({ brief }) => ({
      url: `${SITE_URL}/projects/${brief.slug}`,
      lastModified: brief.updated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
