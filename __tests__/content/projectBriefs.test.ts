/**
 * @jest-environment node
 *
 * The brief files are usually written by an LLM, so this is the check that
 * what it wrote will render: valid addresses, colours and fonts, and sections
 * kept to a size that reads as a page rather than a wall.
 */
import fs from "fs";
import path from "path";
import { BRIEFS } from "../../app/projects/briefs";
import { BRIEF_SLUG, FONT_FAMILY, HEX_COLOR } from "constants/projectBrief";
import { GROUP_PROJECT_MODULES } from "constants/groupWork";

const each = <T,>(list: T[], check: (item: T) => string | null) =>
  list.flatMap((item) => {
    const problem = check(item);
    return problem ? [problem] : [];
  });

describe("project briefs", () => {
  it("lists every brief file in the registry, once per module and address", () => {
    const files = fs
      .readdirSync(path.join(process.cwd(), "app/projects/briefs"))
      .filter((name) => /^module-.*\.ts$/.test(name));
    expect(BRIEFS).toHaveLength(files.length);
    expect(new Set(BRIEFS.map((b) => b.module)).size).toBe(BRIEFS.length);
    expect(new Set(BRIEFS.map((b) => b.slug)).size).toBe(BRIEFS.length);
  });

  it("uses valid modules, addresses, dates, colours, fonts and media", () => {
    const problems = BRIEFS.flatMap((b) => [
      ...each([b], () =>
        (GROUP_PROJECT_MODULES as readonly number[]).includes(b.module) ? null : `${b.slug}: unknown module ${b.module}`
      ),
      ...each([b.slug], (slug) => (BRIEF_SLUG.test(slug) ? null : `bad slug "${slug}"`)),
      ...each([b.updated], (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? null : `${b.slug}: updated must be YYYY-MM-DD`)),
      ...each(Object.entries(b.theme), ([key, value]) =>
        key.endsWith("Font")
          ? FONT_FAMILY.test(value) ? null : `${b.slug}: font "${value}"`
          : HEX_COLOR.test(value) ? null : `${b.slug}: ${key} "${value}" is not #rrggbb`
      ),
      ...each([b.coverImage ?? "https://"], (url) => (url.startsWith("https://") ? null : `${b.slug}: cover must be https`)),
      ...each([b.mission.media], (m) =>
        !m || (m.type === "youtube" ? /^[\w-]{6,20}$/.test(m.id) : m.src.startsWith("https://"))
          ? null
          : `${b.slug}: media`
      ),
    ]);
    expect(problems).toEqual([]);
  });

  it("keeps every section to about a screen", () => {
    const problems = BRIEFS.flatMap((b) => [
      ...each([b.mission.statement], (t) => (t.length <= 200 ? null : `${b.slug}: statement over 200 characters`)),
      ...each([b.mission.paragraphs], (p) => (p.length >= 1 && p.length <= 4 ? null : `${b.slug}: 1–4 mission paragraphs`)),
      ...each([b.mission.goals], (g) => (g.length >= 2 && g.length <= 4 ? null : `${b.slug}: 2–4 goals`)),
      ...each(b.requirements, (r) => (r.items.length <= 8 ? null : `${b.slug}: "${r.label}" has over 8 items`)),
      ...each([b.requirements], (r) => (r.length >= 1 && r.length <= 5 ? null : `${b.slug}: 1–5 requirement tabs`)),
      ...each([b.ideas], (i) => (i.length >= 1 && i.length <= 8 ? null : `${b.slug}: 1–8 ideas`)),
      ...each([b.phases], (p) => (p.length >= 2 && p.length <= 6 ? null : `${b.slug}: 2–6 phases`)),
      ...each(b.phases, (p) => (p.weight > 0 ? null : `${b.slug}: phase "${p.title}" needs a weight above 0`)),
      ...each(b.presentation, (p) => (p.minutes > 0 ? null : `${b.slug}: "${p.title}" needs minutes`)),
      ...each([b.faq], (f) => (f.length <= 8 ? null : `${b.slug}: at most 8 questions`)),
      ...each([b.pickList], (l) => (!l || l.minimum <= l.items.length ? null : `${b.slug}: pick list minimum above its length`)),
    ]);
    expect(problems).toEqual([]);
  });
});
