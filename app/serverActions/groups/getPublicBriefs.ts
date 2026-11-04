// Deliberately not "use server": these are read by server components only,
// and an action would let any browser call getBriefBySlug directly.
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { BriefProject } from "types/groupTypes";
import { ResolvedBrief } from "constants/projectBrief";
import { BRIEFS, briefForSlug } from "../../projects/briefs";
import { isTeacher, requireSession, serializeProject } from "./helpers";

/**
 * Public brief pages. The words come from the static brief files; the dates,
 * rubric and weights from the module's newest project in the database.
 *
 * A brief is public once that project is past team formation: during
 * formation the brief is still the reward for answering the preferences form
 * (helpers.canReadDescription), and a public copy would hand it out for free.
 * A module with no project in the database has no page.
 */

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
const toBriefProject = (doc: any, brief: ResolvedBrief): BriefProject => {
  const p = serializeProject(doc);
  return {
    _id: p._id,
    module: p.module,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    presentationDate: p.presentationDate,
    presentationLength: p.presentationLength,
    rubric: p.rubric,
    panelWeight: p.panelWeight,
    brief,
  };
};

/** The newest project of each module that has a brief. */
async function projectsByModule(modules: number[]) {
  await connectToDatabase();
  const docs = await GroupProject.find({ module: { $in: modules } })
    .sort({ startDate: -1 })
    .lean();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
  const newest = new Map<number, any>();
  for (const doc of docs) {
    if (!newest.has(doc.module as number)) newest.set(doc.module as number, doc);
  }
  return newest;
}

/** Every public brief, in programme order, for /projects and the sitemap. */
export async function getPublicBriefs(): Promise<BriefProject[]> {
  try {
    const projects = await projectsByModule(BRIEFS.map((b) => b.module));
    return BRIEFS.flatMap((brief) => {
      const doc = projects.get(brief.module);
      if (!doc || doc.status === "formation") return [];
      const resolved = briefForSlug(brief.slug);
      return resolved ? [toBriefProject(doc, resolved)] : [];
    });
  } catch (error) {
    console.error("[getPublicBriefs]", error);
    return [];
  }
}

/**
 * One brief by its address. Teachers also get briefs whose project is still
 * forming teams, so they can check the page first; `isPreview` says when that
 * is what they are looking at.
 */
export async function getBriefBySlug(
  slug: string
): Promise<(BriefProject & { isPreview: boolean }) | null> {
  const brief = briefForSlug(slug);
  if (!brief) return null;
  try {
    const projects = await projectsByModule([brief.module]);
    const doc = projects.get(brief.module);
    if (!doc) return null;
    const isPublic = doc.status !== "formation";
    if (!isPublic) {
      const session = await requireSession();
      if (!session || !isTeacher(session)) return null;
    }
    return { ...toBriefProject(doc, brief), isPreview: !isPublic };
  } catch (error) {
    console.error("[getBriefBySlug]", error);
    return null;
  }
}
