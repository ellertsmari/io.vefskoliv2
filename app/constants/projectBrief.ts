/**
 * The structured project brief: a fixed set of sections every group project
 * has, a per-project theme, and the animation hooks teachers can use in a
 * section's HTML. Shared by the public brief page, the student view in the
 * LMS and the teachers' brief editor.
 */

export const BRIEF_SECTION_KEYS = [
  "overview",
  "requirements",
  "deliverables",
  "ideas",
  "timeline",
  "presentation",
  "grading",
] as const;
export type BriefSectionKey = (typeof BRIEF_SECTION_KEYS)[number];

export type BriefSectionMeta = {
  key: BriefSectionKey;
  defaultTitle: string;
  icon: string;
  /** What belongs here, for the empty state in the editor. */
  hint: string;
  /**
   * Built from the project's own data (dates, rubric), so the section shows
   * even with no HTML — the HTML is an optional intro above it.
   */
  automatic?: boolean;
};

export const BRIEF_SECTIONS: BriefSectionMeta[] = [
  {
    key: "overview",
    defaultTitle: "The brief",
    icon: "mdi:compass-outline",
    hint: "What the project is and why it matters, in a few paragraphs.",
  },
  {
    key: "requirements",
    defaultTitle: "Requirements",
    icon: "mdi:clipboard-check-outline",
    hint: "What every team has to do: process, design, tech.",
  },
  {
    key: "deliverables",
    defaultTitle: "Deliverables",
    icon: "mdi:package-variant-closed",
    hint: "What gets handed in at the end, and where.",
  },
  {
    key: "ideas",
    defaultTitle: "Theme ideas",
    icon: "mdi:lightbulb-on-outline",
    hint: "Ideas to start from. Cards work well here.",
  },
  {
    key: "timeline",
    defaultTitle: "Timeline",
    icon: "mdi:timeline-clock-outline",
    hint: "Optional notes above the dates — milestones, check-ins.",
    automatic: true,
  },
  {
    key: "presentation",
    defaultTitle: "Presentation",
    icon: "mdi:presentation",
    hint: "How the presentation runs, part by part.",
  },
  {
    key: "grading",
    defaultTitle: "How it's graded",
    icon: "mdi:scale-balance",
    hint: "Optional intro above the rubric and the grade weights.",
    automatic: true,
  },
];

export const briefSectionMeta = (key: BriefSectionKey): BriefSectionMeta =>
  BRIEF_SECTIONS.find((section) => section.key === key)!;

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

/** Suggestions for the font fields; any Google Fonts family name works. */
export const BRIEF_FONT_SUGGESTIONS = [
  "Fraunces",
  "Playfair Display",
  "DM Serif Display",
  "Instrument Serif",
  "Libre Caslon Text",
  "Source Serif 4",
  "Inter",
  "Source Sans 3",
  "DM Sans",
  "Manrope",
  "Space Grotesk",
  "Syne",
  "Archivo",
  "Bricolage Grotesque",
  "Unbounded",
  "Bebas Neue",
  "JetBrains Mono",
  "Space Mono",
];

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

/**
 * "Module 4 — Group Project: Connecting to the World" → "Connecting to the
 * World". The cover already says the module and "Group project" above the
 * title, so the long form only repeated itself in giant type.
 */
export const briefDisplayTitle = (title: string): string =>
  title.replace(/^\s*module\s*\d+\s*[—–:-]\s*(group\s*project\s*:?\s*)?/i, "").trim() || title;

/** Default page address: "module-4-connecting-to-the-world". */
export const defaultBriefSlug = (title: string, module: number | null | undefined): string =>
  slugify([module ? `module ${module}` : "", briefDisplayTitle(title)].join(" "));

export const slugify = (text: string): string =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ðÐ]/g, "d")
    .replace(/[þÞ]/g, "th")
    .replace(/[æÆ]/g, "ae")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

/**
 * The animation and layout hooks a section's HTML can use. Listed in the
 * editor as a cheat sheet with one-click inserts.
 */
export const BRIEF_SNIPPETS: Array<{ label: string; html: string; note: string }> = [
  {
    label: "Lead paragraph",
    note: "Large intro text",
    html: '<p class="brief-lead" data-animate="fade-up">A big opening sentence.</p>',
  },
  {
    label: "Cards",
    note: "Grid of cards that come in one after another",
    html: `<div class="brief-grid" data-stagger>
  <div class="brief-card"><h3>Idea one</h3><p>Short description.</p></div>
  <div class="brief-card"><h3>Idea two</h3><p>Short description.</p></div>
  <div class="brief-card"><h3>Idea three</h3><p>Short description.</p></div>
</div>`,
  },
  {
    label: "Big numbers",
    note: "Count up when scrolled into view — write the final number in both places",
    html: `<div class="brief-stats" data-stagger>
  <div class="brief-stat"><strong data-count="4">4</strong><span>weeks</span></div>
  <div class="brief-stat"><strong data-count="30">30</strong><span>minute presentation</span></div>
</div>`,
  },
  {
    label: "Callout",
    note: "Highlighted box for what must not be missed",
    html: '<div class="brief-callout" data-animate="zoom-in"><strong>Important:</strong> the product must be online.</div>',
  },
  {
    label: "Checklist",
    note: "Ticked list",
    html: `<ul class="brief-checklist" data-stagger>
  <li>First requirement</li>
  <li>Second requirement</li>
</ul>`,
  },
  {
    label: "Steps",
    note: "Numbered steps with timings",
    html: `<ol class="brief-steps" data-stagger>
  <li><strong>Introduction</strong> <span class="brief-pill">5 min</span><p>Demo, tools, how you worked.</p></li>
  <li><strong>Design</strong> <span class="brief-pill">7 min</span><p>Research, prototypes, style guide.</p></li>
</ol>`,
  },
  {
    label: "Two columns",
    note: "Side by side on wide screens",
    html: `<div class="brief-columns">
  <div data-animate="slide-right"><h3>Design</h3><p>…</p></div>
  <div data-animate="slide-left"><h3>Code</h3><p>…</p></div>
</div>`,
  },
  {
    label: "YouTube video",
    note: "Responsive 16:9 embed",
    html: `<div class="brief-video" data-animate="fade-up">
  <iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="Video" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>
</div>`,
  },
  {
    label: "Image",
    note: "Full-width image with a caption",
    html: `<figure class="brief-figure" data-animate="blur-in">
  <img src="https://…" alt="Describe the image" loading="lazy">
  <figcaption>Caption</figcaption>
</figure>`,
  },
  {
    label: "Parallax image",
    note: "Drifts slightly as you scroll",
    html: '<img class="brief-wide" data-parallax="0.15" src="https://…" alt="" loading="lazy">',
  },
];

export const BRIEF_ANIMATIONS = [
  "fade-up",
  "fade-in",
  "zoom-in",
  "slide-left",
  "slide-right",
  "blur-in",
] as const;
