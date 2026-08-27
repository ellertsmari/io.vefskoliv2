/**
 * A guide's reading list, gathered from the three places it can come from.
 *
 * Kept out of the component so the gathering rules — which entries count, and
 * what happens when the same link is listed twice — are testable on their own.
 */

export type Material = { title: string; link: string };

/** Structural, not ClientGuide, so this stays independent of the guide model. */
export type MaterialSources = {
  resources?: ({ description?: string | null; link?: string | null } | null)[] | null;
  classes?: ({ title?: string | null; link?: string | null } | null)[] | null;
  references?: ({ name?: string | null; link?: string | null } | null)[] | null;
};

/**
 * Order is resources, then class materials, then references — the order a
 * student is most likely to want them in.
 *
 * Duplicates are dropped by link. A guide really does list the same URL under
 * more than one heading (the same freeCodeCamp page as both a class material
 * and a resource), which showed up as React's "two children with the same key"
 * warning; but even without that, offering the same link twice is just noise.
 */
export function collectMaterials(sources: MaterialSources): Material[] {
  const candidates: Material[] = [
    ...(sources.resources ?? []).map((entry) => ({
      title: entry?.description ?? "",
      link: entry?.link ?? "",
    })),
    ...(sources.classes ?? []).map((entry) => ({
      title: entry?.title ?? "",
      link: entry?.link ?? "",
    })),
    ...(sources.references ?? []).map((entry) => ({
      title: entry?.name ?? "",
      link: entry?.link ?? "",
    })),
  ];

  const seen = new Set<string>();
  const materials: Material[] = [];

  for (const candidate of candidates) {
    const title = candidate.title?.trim() ?? "";
    const link = candidate.link?.trim() ?? "";

    // A material with no label can't be rendered, and one with no link has
    // nowhere to go — neither should count towards whether the tile exists.
    if (!title || !link) continue;
    if (seen.has(link)) continue;

    seen.add(link);
    materials.push({ title, link });
  }

  return materials;
}
