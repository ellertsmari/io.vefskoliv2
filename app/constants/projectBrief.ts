/**
 * A group project brief: one static file per module in app/projects/briefs,
 * written (usually with an LLM — see docs/writing-a-project-brief.md) and
 * reviewed like any other code. The brief holds the words and the look; the
 * dates, rubric and grade weights come from the module's project in the
 * database, so the page is never out of step with what is graded.
 *
 * Text fields accept a little inline formatting: **bold**, *italic*,
 * `code` and [links](https://…). Nothing else is interpreted.
 */

/** A card with an icon (any Iconify name, e.g. "mdi:map-outline"). */
export type BriefCard = { icon: string; title: string; text: string };

export type BriefMedia =
  | { type: "youtube"; id: string; title: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  /** A self-hosted film, e.g. "/projects/<slug>.mp4" in public/. */
  | { type: "video"; src: string; title: string; poster?: string; caption?: string };

export type ProjectBrief = {
  /** Which module's project supplies the dates, rubric and weights. */
  module: number;
  /** The public address: /projects/<slug>. */
  slug: string;
  /** Short display title, without "Module N — Group Project:". */
  title: string;
  /** One sentence under the title on the cover. */
  tagline: string;
  /** "4–5 students", "One team of everyone"; empty to leave it off. */
  teamSize: string;
  /** Last real change to the brief, YYYY-MM-DD (sitemap, structured data). */
  updated: string;
  /** Optional https:// image behind the cover. */
  coverImage?: string;
  theme: Partial<BriefTheme>;

  /** 01 — why this project exists. Keep it to a screen or so. */
  mission: {
    /** A big opening statement, one or two sentences. */
    statement: string;
    paragraphs: string[];
    /** A side note that deepens the why — a story, a law, a fact. */
    aside?: { title: string; text: string };
    media?: BriefMedia;
    /** The three or four things a team will have shown by the end. */
    goals: BriefCard[];
  };

  /** 02 — what every team must do, one tab per area. */
  requirements: Array<{ label: string; icon: string; intro?: string; items: string[] }>;
  /** Optional extras that impress but are not required. */
  bonus?: { title: string; items: string[] };
  /** What is handed in at the end — becomes a checklist. */
  handIn: string[];

  /** 03 — starting points for the team's own idea. */
  ideas: BriefCard[];
  /** Said under the ideas, e.g. "Your own idea is welcome — talk to us first." */
  ideasNote?: string;

  /**
   * 04 — the phases between kick-off and presentation day, in order. Each
   * phase gets a share of that time proportional to its `weight`, so the
   * timeline still fits when the dates move.
   */
  phases: Array<{
    title: string;
    icon: string;
    weight: number;
    text: string;
    tasks: string[];
  }>;

  /**
   * 05 — the presentation, part by part. `criteria` are rubric keys from the
   * project in the database; the page shows their titles and highlights them.
   */
  presentation: Array<{ title: string; minutes: number; text: string; criteria: string[] }>;

  /** Said under the agenda, e.g. who sees the presentation first. */
  presentationNote?: string;

  /**
   * Optional: a list the team must pick a minimum from ("at least 9 of these
   * complexity aspects"). Shown as a checklist students can try out.
   */
  pickList?: { title: string; intro: string; minimum: number; items: string[] };

  /** 07 — questions students actually ask. Also marked up for search engines. */
  faq: Array<{ question: string; answer: string }>;
};

/** A brief with every theme field filled in, as the page receives it. */
export type ResolvedBrief = Omit<ProjectBrief, "theme"> & { theme: BriefTheme };

export type BriefTheme = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  heroBackground: string;
  heroText: string;
  headingFont: string;
  bodyFont: string;
};

export const BRIEF_COLOR_FIELDS: Array<{
  key: Exclude<keyof BriefTheme, "headingFont" | "bodyFont">;
  label: string;
}> = [
  { key: "heroBackground", label: "Cover background" },
  { key: "heroText", label: "Cover text" },
  { key: "background", label: "Page background" },
  { key: "surface", label: "Cards" },
  { key: "text", label: "Text" },
  { key: "muted", label: "Secondary text" },
  { key: "accent", label: "Accent" },
  { key: "accentText", label: "Text on accent" },
];

/** An annual-report default: warm paper, ink, one strong blue. */
export const DEFAULT_BRIEF_THEME: BriefTheme = {
  background: "#f5f2ec",
  surface: "#ffffff",
  text: "#16151b",
  muted: "#5e5b66",
  accent: "#2f4fe0",
  accentText: "#ffffff",
  heroBackground: "#16151b",
  heroText: "#f5f2ec",
  headingFont: "Fraunces",
  bodyFont: "Source Sans 3",
};

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
export const FONT_FAMILY = /^[A-Za-z0-9 ]{1,40}$/;
export const BRIEF_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Every theme field, falling back to the default when missing or invalid. */
export function resolveBriefTheme(
  theme: Partial<BriefTheme> | null | undefined
): BriefTheme {
  const resolved = { ...DEFAULT_BRIEF_THEME };
  if (!theme) return resolved;
  for (const { key } of BRIEF_COLOR_FIELDS) {
    const value = theme[key];
    if (value && HEX_COLOR.test(value)) resolved[key] = value;
  }
  if (theme.headingFont && FONT_FAMILY.test(theme.headingFont)) {
    resolved.headingFont = theme.headingFont;
  }
  if (theme.bodyFont && FONT_FAMILY.test(theme.bodyFont)) {
    resolved.bodyFont = theme.bodyFont;
  }
  return resolved;
}

/**
 * Google Fonts stylesheets for a theme. One request per weight, because the
 * API rejects a whole request when a family lacks one of the weights asked
 * for — a display face with only a 400 would otherwise load nothing at all.
 */
export function briefFontUrls(theme: BriefTheme): string[] {
  const families = Array.from(new Set([theme.headingFont, theme.bodyFont]));
  return families.flatMap((family) =>
    [400, 700].map(
      (weight) =>
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          family
        ).replace(/%20/g, "+")}:wght@${weight}&display=swap`
    )
  );
}


export const resolveBrief = (brief: ProjectBrief): ResolvedBrief => ({
  ...brief,
  theme: resolveBriefTheme(brief.theme),
});
