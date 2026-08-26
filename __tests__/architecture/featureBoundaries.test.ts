/**
 * @jest-environment node
 *
 * Features may depend on shared layers, never sideways on each other.
 *
 * Right now this codebase is in good shape: the dependency graph is layered,
 * and the handful of feature-to-feature imports that exist are listed below.
 * Nothing enforces that, though, and the failure mode is slow and invisible —
 * one convenient import at a time until group work cannot be changed without
 * breaking guides, and the calendar cannot be touched at all.
 *
 * The rule: a file belonging to one feature must not import from another
 * feature's directory. Shared code (models, types, utils, constants, the UI kit,
 * global styles, non-feature server actions) is fair game for everyone, because
 * it depends on nothing above it.
 *
 * Two exemptions, both deliberate:
 *
 *   - Route composition roots (page.tsx, layout.tsx, and friends) are where
 *     features are assembled into a screen. Wiring group work and guides onto
 *     one dashboard page is the page's job, not a boundary violation.
 *
 *   - KNOWN_VIOLATIONS is the debt that predates this test. It only shrinks.
 *     Do not add to it — if a new import needs to cross a feature boundary,
 *     the shared thing it needs belongs in a shared layer instead.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCANNED_DIRS = ["app", "types"];

/**
 * Which feature a path belongs to. Ordered: the first matching prefix wins, so
 * more specific paths must come before the directories that contain them.
 */
const FEATURES: Array<[prefix: string, feature: string]> = [
  ["app/guides", "guides"],
  ["app/api/guides", "guides"],

  ["app/LMS/groups", "group-work"],
  ["app/serverActions/groups", "group-work"],
  ["app/showcase", "group-work"],
  ["app/judge", "group-work"],

  ["app/LMS/calendar", "calendar"],

  ["app/LMS/dashboard", "dashboard"],
  ["app/LMS/edit-guides", "edit-guides"],
  ["app/components/editGuides", "edit-guides"],
  ["app/LMS/people", "people"],
  ["app/LMS/reports", "reports"],
  ["app/LMS/resources", "resources"],
  ["app/LMS/docs", "lms-docs"],

  ["app/lti", "lti"],
  ["app/api/lti", "lti"],

  ["app/components/studentHome", "student-home"],
  ["app/components/teacherHome", "teacher-home"],
  ["app/components/gallery", "gallery"],
  ["app/components/landingPageTeachers", "landing-teachers"],
  ["app/components/user", "user-profile"],
  ["app/components/auth", "auth-ui"],
  ["app/signin", "auth-ui"],
  ["app/landingPage", "landing"],
  ["app/halloffame", "hall-of-fame"],
];

/** tsconfig.json "paths", as prefix rewrites. Keep in sync with tsconfig. */
const ALIASES: Record<string, string> = {
  "UIcomponents/": "app/UIcomponents/",
  "globalStyles/": "app/globalStyles/",
  "serverActions/": "app/serverActions/",
  "assets/": "app/assets/",
  "models/": "app/models/",
  "providers/": "app/providers/",
  "types/": "types/",
  "utils/": "app/utils/",
  "constants/": "app/constants/",
};

/**
 * Debt that predates this test, as "importer  ->  imported". Only ever remove
 * entries from this list.
 */
const KNOWN_VIOLATIONS: string[] = [
  // StudentHomePage is a composition root wearing a component's clothes: it is
  // rendered by app/LMS/dashboard/page.tsx and assembles guides onto the student
  // dashboard. It stops being a violation once app/components/ is split into
  // feature folders (studentHome, teacherHome, gallery, ... are seven features
  // sharing one bucket) and this one moves next to the page that renders it.
  "app/components/studentHome/StudentHomePage.tsx  ->  app/guides/components/guideCard/GuideCard",
];

/** Route files compose features into a screen; that is what they are for. */
const COMPOSITION_ROOTS =
  /^(page|layout|template|loading|error|not-found|global-error|route|default)\.tsx?$/;

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });

const toPosix = (p: string) => p.split(path.sep).join("/");

const featureOf = (repoPath: string): string | null => {
  for (const [prefix, feature] of FEATURES) {
    if (repoPath === prefix || repoPath.startsWith(prefix + "/")) return feature;
  }
  return null;
};

/** Resolve an import specifier to a repo-relative path, or null if external. */
const resolveImport = (fromFile: string, specifier: string): string | null => {
  if (specifier.startsWith(".")) {
    return toPosix(
      path.relative(ROOT, path.resolve(path.dirname(fromFile), specifier))
    );
  }
  const alias = Object.keys(ALIASES).find((a) => specifier.startsWith(a));
  if (!alias) return null;
  return ALIASES[alias] + specifier.slice(alias.length);
};

const IMPORT_PATTERN = /(?:from|import)\s+["']([^"']+)["']/g;

const collectCrossings = () => {
  const crossings: string[] = [];

  for (const dir of SCANNED_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const repoPath = toPosix(path.relative(ROOT, file));
      const from = featureOf(repoPath);
      if (!from) continue;
      if (COMPOSITION_ROOTS.test(path.basename(repoPath))) continue;

      const source = fs.readFileSync(file, "utf-8");
      for (const match of source.matchAll(IMPORT_PATTERN)) {
        const target = resolveImport(file, match[1]);
        if (!target) continue;
        const to = featureOf(target);
        if (!to || to === from) continue;
        const entry = `${repoPath}  ->  ${target}`;
        if (!crossings.includes(entry)) crossings.push(entry);
      }
    }
  }

  return crossings.sort();
};

describe("feature boundaries", () => {
  const crossings = collectCrossings();

  it("no feature imports another feature's internals", () => {
    const unexpected = crossings.filter((c) => !KNOWN_VIOLATIONS.includes(c));

    if (unexpected.length > 0) {
      throw new Error(
        "A feature is importing another feature's internals:\n\n" +
          unexpected.map((c) => "  " + c).join("\n") +
          "\n\nFeatures may depend on shared layers (models, types, utils," +
          "\nconstants, UIcomponents, globalStyles, non-feature serverActions)," +
          "\nbut not on each other. If both features need this, move it down" +
          "\ninto a shared layer. If one feature owns it, the importer probably" +
          "\nbelongs to that feature too.\n\nSee this file's header for why."
      );
    }
  });

  it("known violations are actually still there, so the list stays honest", () => {
    const fixed = KNOWN_VIOLATIONS.filter((v) => !crossings.includes(v));
    expect(fixed).toEqual([]);
  });

  /**
   * Moving a directory is the one refactor git cannot fully merge for you. It
   * replays edits to moved files at the new path, but a file someone *added*
   * to the old directory on another branch merges cleanly and silently stays
   * behind — orphaned next to code that has moved away, with its relative
   * imports pointing into an empty tree. Nothing else catches this: an
   * unclassified path looks like shared code to the rule above.
   */
  it("directories this refactor emptied are still empty", () => {
    const EMPTIED = ["app/LMS/components"];

    const survivors = EMPTIED.filter((dir) =>
      fs.existsSync(path.join(ROOT, dir))
    ).flatMap((dir) =>
      walk(path.join(ROOT, dir)).map((f) => toPosix(path.relative(ROOT, f)))
    );

    if (survivors.length > 0) {
      throw new Error(
        "Files reappeared in a directory that was moved away:\n\n" +
          survivors.map((f) => "  " + f).join("\n") +
          "\n\nThis is almost always a merge or rebase that brought in a file" +
          "\nadded to the old location on another branch. git reports success" +
          "\nfor this and leaves the build broken. Move them to the matching" +
          "\npath under app/guides/components/ and fix their imports." +
          "\n\nSee docs/merging-feature-boundaries.md."
      );
    }
  });

  it("actually inspects files, so a broken matcher cannot pass silently", () => {
    const scanned = SCANNED_DIRS.flatMap((d) => walk(path.join(ROOT, d)))
      .map((f) => toPosix(path.relative(ROOT, f)))
      .filter((f) => featureOf(f) !== null);
    expect(scanned.length).toBeGreaterThan(100);

    expect(featureOf("app/LMS/groups/page.tsx")).toBe("group-work");
    expect(featureOf("app/guides/components/guideCard/GuideCard.tsx")).toBe("guides");
    expect(featureOf("app/utils/errors.ts")).toBeNull();
    expect(resolveImport(path.join(ROOT, "app/x/y.ts"), "models/guide")).toBe(
      "app/models/guide"
    );
  });
});
