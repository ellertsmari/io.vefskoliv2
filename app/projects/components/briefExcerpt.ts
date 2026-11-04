import { BriefProject } from "types/groupTypes";

/** A one-line plain-text summary for meta descriptions and cards. */
export function briefExcerpt(project: Pick<BriefProject, "brief">, max = 160): string {
  const overview = project.brief.sections.find((s) => s.key === "overview")?.html ?? "";
  const text = [project.brief.tagline, overview.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ")]
    .filter(Boolean)
    .join(". ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;|&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\.\s*\./g, ".")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}
