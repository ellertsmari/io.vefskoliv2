// Deliberately not "use server": these are read by server components only,
// and an action would let any browser call getBriefBySlug directly.
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { BriefProject } from "types/groupTypes";
import { isTeacher, requireSession, serializeProject } from "./helpers";

/**
 * Public brief pages. A brief is public when a teacher has published it and
 * teams are no longer forming: during formation the brief is still the
 * reward for answering the preferences form (helpers.canReadDescription),
 * and a public copy would hand it out for free.
 */
const PUBLIC_FILTER = {
  published: true,
  status: { $ne: "formation" },
  slug: { $type: "string", $ne: "" },
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
const toBriefProject = (doc: any): BriefProject => {
  const p = serializeProject(doc);
  return {
    _id: p._id,
    title: p.title,
    module: p.module,
    slug: p.slug,
    status: p.status,
    published: p.published,
    startDate: p.startDate,
    endDate: p.endDate,
    presentationDate: p.presentationDate,
    presentationLength: p.presentationLength,
    rubric: p.rubric,
    panelWeight: p.panelWeight,
    brief: p.brief,
  };
};

/** Every public brief, newest first, for /projects and the sitemap. */
export async function getPublicBriefs(): Promise<BriefProject[]> {
  try {
    await connectToDatabase();
    const docs = await GroupProject.find(PUBLIC_FILTER)
      .sort({ startDate: -1 })
      .lean();
    return docs.map(toBriefProject);
  } catch (error) {
    console.error("[getPublicBriefs]", error);
    return [];
  }
}

/**
 * One brief by its address. Teachers also get unpublished and still-forming
 * projects, so they can see the page before it goes live; `isPreview` says
 * when that is what they are looking at.
 */
export async function getBriefBySlug(
  slug: string
): Promise<(BriefProject & { isPreview: boolean }) | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  try {
    const session = await requireSession();
    const preview = !!session && isTeacher(session);
    await connectToDatabase();
    const doc = await GroupProject.findOne(
      preview ? { slug } : { ...PUBLIC_FILTER, slug }
    ).lean();
    if (!doc) return null;
    const project = toBriefProject(doc);
    const isPublic = project.published && project.status !== "formation";
    return { ...project, isPreview: !isPublic };
  } catch (error) {
    console.error("[getBriefBySlug]", error);
    return null;
  }
}
