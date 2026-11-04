import { ProjectBrief, ResolvedBrief, resolveBrief } from "constants/projectBrief";
import { firstWebsite } from "./module-1-first-website";
import { theFundamentals } from "./module-3-the-fundamentals";
import { connectingToTheWorld } from "./module-4-connecting-to-the-world";
import { backEndAndInfrastructure } from "./module-5-back-end-and-infrastructure";
import { growingComplexity } from "./module-6-growing-complexity";

/**
 * Every group project brief, in programme order. One file per module; to
 * write or rewrite one, see docs/writing-a-project-brief.md.
 *
 * The brief for a module is shown on that module's project in the LMS and at
 * /projects/<slug> once that project is past team formation.
 */
export const BRIEFS: ProjectBrief[] = [
  firstWebsite,
  theFundamentals,
  connectingToTheWorld,
  backEndAndInfrastructure,
  growingComplexity,
];

export const briefForModule = (module: number | null | undefined): ResolvedBrief | null => {
  const brief = BRIEFS.find((b) => b.module === module);
  return brief ? resolveBrief(brief) : null;
};

export const briefForSlug = (slug: string): ResolvedBrief | null => {
  const brief = BRIEFS.find((b) => b.slug === slug);
  return brief ? resolveBrief(brief) : null;
};
