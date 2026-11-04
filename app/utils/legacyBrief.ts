import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { BriefSectionKey } from "constants/projectBrief";
import { sanitizeBriefHtml } from "./briefHtml";

/**
 * Turns an old one-block Markdown description into the structured brief, as a
 * starting point the teacher then edits section by section. Nothing here is
 * saved without the teacher pressing the button.
 *
 * The old briefs share a shape: a "## Title — subtitle" line, an intro,
 * "### Requirements" (or Deliverables, What to practice), "### Presentation —
 * 30 min", and bold one-liners such as "**Theme ideas:** …" and "**Groups of
 * 4–5 students.**". Anything that matches none of the sections stays in the
 * overview, so nothing is lost.
 */

const markdown = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

const toHtml = (md: string) =>
  md.trim() ? sanitizeBriefHtml(String(markdown.processSync(md.trim()))) : "";

const sectionFor = (heading: string): BriefSectionKey | null => {
  const text = heading.toLowerCase();
  if (/deliverable|hand.?in/.test(text)) return "deliverables";
  if (/requirement|practi[cs]e|must|scope/.test(text)) return "requirements";
  if (/present/.test(text)) return "presentation";
  if (/idea|theme|inspiration/.test(text)) return "ideas";
  if (/grad|rubric|assess|evaluat/.test(text)) return "grading";
  if (/timeline|schedule|milestone|dates/.test(text)) return "timeline";
  return null;
};

export type LegacyBrief = {
  tagline: string;
  teamSize: string;
  sections: Array<{ key: BriefSectionKey; title: string; html: string }>;
};

export function legacyDescriptionToBrief(description: string): LegacyBrief {
  const buckets = new Map<BriefSectionKey, string[]>();
  const push = (key: BriefSectionKey, line: string) => {
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(line);
  };

  let tagline = "";
  let teamSize = "";
  let current: BriefSectionKey = "overview";

  for (const line of description.replace(/\r\n/g, "\n").split("\n")) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2 && !tagline) {
      tagline = h2[1].replace(/\*\*/g, "").trim();
      continue;
    }

    const heading = line.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      const key = sectionFor(heading[1]);
      if (key) {
        current = key;
        continue;
      }
      // Unknown heading: keep it, inside whatever section it sits in.
      push(current, line);
      continue;
    }

    const ideas = line.match(/^\*\*(?:theme )?ideas?:?\*\*:?\s*(.+)$/i);
    if (ideas) {
      push("ideas", ideas[1]);
      continue;
    }

    const groups = line.match(/^\*\*\s*(groups? of [^*]+?|one group of [^*]+?)\.?\s*\*\*(.*)$/i);
    if (groups) {
      teamSize = groups[1]
        .replace(/^groups? of /i, "")
        .replace(/^one group of /i, "")
        .trim();
      teamSize = teamSize.charAt(0).toUpperCase() + teamSize.slice(1);
      // Whatever follows on the same line still says something.
      if (groups[2].trim()) push(current, groups[2].trim());
      continue;
    }

    push(current, line);
  }

  const sections = Array.from(buckets.entries())
    .map(([key, lines]) => ({ key, title: "", html: toHtml(lines.join("\n")) }))
    .filter((section) => section.html);

  return { tagline, teamSize, sections };
}
