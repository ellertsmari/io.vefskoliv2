import { SITE_NAME } from "constants/site";

/**
 * What search engines and link previews are told about a guide. Pure, so the
 * rules can be tested without a request.
 */

type GuideLike = {
  title?: string | null;
  description?: string | null;
  module?: { title?: string | null; number?: number | string | null } | null;
};

/** The placeholders a new guide is created with (app/api/guides/route.ts). */
const DRAFT_TITLE = "Untitled guide";
const DRAFT_DESCRIPTION = /^\s*TODO\b/;

/**
 * A guide a teacher has created but not written yet. There is no published
 * flag on the model, so the placeholders are the signal: drafts stay out of
 * the public list and the sitemap, and ask not to be indexed.
 */
export const isDraftGuide = (guide: GuideLike): boolean =>
  !guide.title?.trim() ||
  guide.title.trim() === DRAFT_TITLE ||
  DRAFT_DESCRIPTION.test(guide.description ?? "");

/**
 * Markdown as one plain line, cut at a word boundary: what a search result
 * shows under the title. Links keep their text, images and code fences go.
 */
export const plainExcerpt = (markdown: string, maxLength = 155): string => {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
};

/** "3 - The fundamentals" → "The fundamentals"; "Module 3" if that's all there is. */
export const moduleDisplayName = (module: GuideLike["module"]): string | null => {
  const title = module?.title?.trim() ?? "";
  const name = title.replace(/^\d+\s*[-–—:.]?\s*/, "").trim();
  if (name) return name;
  return module?.number != null && module.number !== ""
    ? `Module ${module.number}`
    : null;
};

/** "Wireframe · The fundamentals · Vefskólinn" */
export const guidePageTitle = (guide: GuideLike): string =>
  [guide.title?.trim() || "Guide", moduleDisplayName(guide.module), SITE_NAME]
    .filter(Boolean)
    .join(" · ");
