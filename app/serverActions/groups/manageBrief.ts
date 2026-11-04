"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import {
  BRIEF_COLOR_FIELDS,
  BRIEF_SECTION_KEYS,
  BRIEF_SLUG,
  FONT_FAMILY,
  HEX_COLOR,
  defaultBriefSlug,
} from "constants/projectBrief";
import { sanitizeBriefHtml } from "utils/briefHtml";
import { legacyDescriptionToBrief } from "utils/legacyBrief";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  invalidInput,
  success,
} from "utils/errors";
import { SerializedBrief } from "types/groupTypes";
import { isTeacher, objectIdSchema, requireSession, serializeBrief } from "./helpers";

/**
 * Teachers edit the brief one piece at a time: a section, the look, or the
 * publishing settings. Each save touches only its own fields, so two teachers
 * working on different sections do not overwrite each other.
 */

const requireTeacher = async () => {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);
  return null;
};

/** The public page and the index show the change on the next request. */
const refreshPublic = (slug?: string | null) => {
  try {
    revalidatePath("/projects");
    if (slug) revalidatePath(`/projects/${slug}`);
  } catch (error) {
    console.warn("[manageBrief] revalidatePath failed", error);
  }
};

const SectionSchema = z.object({
  projectId: objectIdSchema,
  key: z.enum(BRIEF_SECTION_KEYS),
  title: z.string().trim().max(120).default(""),
  html: z.string().max(100_000).default(""),
});

export async function saveBriefSection(
  data: z.input<typeof SectionSchema>
): Promise<ActionResult<SerializedBrief>> {
  const denied = await requireTeacher();
  if (denied) return denied;
  const validated = SectionSchema.safeParse(data);
  if (!validated.success) return invalidInput(validated.error);
  const { projectId, key, title, html } = validated.data;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId).lean<GroupProjectLean | null>();
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));

    const clean = sanitizeBriefHtml(html);
    // Pull then push, so the section's place in the array never matters and
    // no other section is rewritten.
    await GroupProject.updateOne(
      { _id: projectId },
      { $pull: { "brief.sections": { key } } }
    );
    const updated = await GroupProject.findByIdAndUpdate(
      projectId,
      {
        $push: { "brief.sections": { key, title, html: clean } },
        $set: { "brief.updatedAt": new Date() },
      },
      { new: true }
    ).lean<GroupProjectLean | null>();
    refreshPublic(project.slug);
    return success(serializeBrief(updated?.brief));
  } catch (error) {
    return handleActionError("saveBriefSection", error, ErrorMessages.FAILED_TO_UPDATE("brief section"));
  }
}

const optionalColor = z
  .string()
  .trim()
  .refine((value) => value === "" || HEX_COLOR.test(value), {
    message: "Colours must be hex, like #2f4fe0",
  });
const optionalFont = z
  .string()
  .trim()
  .refine((value) => value === "" || FONT_FAMILY.test(value), {
    message: "Font names may only contain letters, numbers and spaces",
  });

const LookSchema = z.object({
  projectId: objectIdSchema,
  tagline: z.string().trim().max(300).default(""),
  teamSize: z.string().trim().max(60).default(""),
  coverImage: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => value === "" || /^https:\/\//.test(value), {
      message: "The cover image must be an https:// address",
    })
    .default(""),
  theme: z.object({
    ...Object.fromEntries(BRIEF_COLOR_FIELDS.map(({ key }) => [key, optionalColor])),
    headingFont: optionalFont,
    bodyFont: optionalFont,
  } as Record<string, typeof optionalColor>),
});

/** Cover, tagline, team size and every theme colour and font. */
export async function saveBriefLook(
  data: z.input<typeof LookSchema>
): Promise<ActionResult<SerializedBrief>> {
  const denied = await requireTeacher();
  if (denied) return denied;
  const validated = LookSchema.safeParse(data);
  if (!validated.success) return invalidInput(validated.error);
  const { projectId, tagline, teamSize, coverImage, theme } = validated.data;

  try {
    await connectToDatabase();
    const updated = await GroupProject.findByIdAndUpdate(
      projectId,
      {
        $set: {
          "brief.tagline": tagline,
          "brief.teamSize": teamSize,
          "brief.coverImage": coverImage,
          "brief.theme": theme,
          "brief.updatedAt": new Date(),
        },
      },
      { new: true }
    ).lean<GroupProjectLean | null>();
    if (!updated) return failure(ErrorMessages.NOT_FOUND("Group project"));
    refreshPublic(updated.slug);
    return success(serializeBrief(updated.brief));
  } catch (error) {
    return handleActionError("saveBriefLook", error, ErrorMessages.FAILED_TO_UPDATE("brief"));
  }
}

const PublishSchema = z.object({
  projectId: objectIdSchema,
  published: z.boolean(),
  slug: z
    .string()
    .trim()
    .max(80)
    .refine((value) => value === "" || BRIEF_SLUG.test(value), {
      message: "The address may only use lowercase letters, numbers and dashes",
    }),
});

/** Publish or unpublish, and set the page address (made from the title if empty). */
export async function setBriefPublishing(
  data: z.input<typeof PublishSchema>
): Promise<ActionResult<{ slug: string; published: boolean }>> {
  const denied = await requireTeacher();
  if (denied) return denied;
  const validated = PublishSchema.safeParse(data);
  if (!validated.success) return invalidInput(validated.error);
  const { projectId, published } = validated.data;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId).lean<GroupProjectLean | null>();
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));

    const slug = validated.data.slug || project.slug || defaultBriefSlug(project.title, project.module);
    if (!slug) return failure("Give the page an address");
    const clash = await GroupProject.exists({ slug, _id: { $ne: projectId } });
    if (clash) return failure(`Another project already uses /projects/${slug}`);

    await GroupProject.updateOne({ _id: projectId }, { $set: { slug, published } });
    refreshPublic(slug);
    if (project.slug && project.slug !== slug) refreshPublic(project.slug);
    return success({ slug, published });
  } catch (error) {
    return handleActionError("setBriefPublishing", error, ErrorMessages.FAILED_TO_UPDATE("publishing"));
  }
}

/**
 * Fill the brief from the old Markdown description. Only sections that are
 * still empty are filled, so pressing it twice — or after editing — never
 * overwrites a teacher's work.
 */
export async function importLegacyBrief(
  projectId: string
): Promise<ActionResult<SerializedBrief>> {
  const denied = await requireTeacher();
  if (denied) return denied;
  if (!objectIdSchema.safeParse(projectId).success) {
    return failure(ErrorMessages.INVALID_INPUT);
  }

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId).lean<GroupProjectLean | null>();
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    if (!project.description?.trim()) return failure("There is no old description to import");

    const legacy = legacyDescriptionToBrief(project.description);
    const existing = project.brief?.sections ?? [];
    const filled = new Set(existing.filter((s) => s.html?.trim()).map((s) => s.key));
    const sections = [
      ...existing.filter((s) => filled.has(s.key)),
      ...legacy.sections.filter((s) => !filled.has(s.key)),
    ];

    const updated = await GroupProject.findByIdAndUpdate(
      projectId,
      {
        $set: {
          "brief.sections": sections,
          "brief.tagline": project.brief?.tagline || legacy.tagline,
          "brief.teamSize": project.brief?.teamSize || legacy.teamSize,
          "brief.updatedAt": new Date(),
        },
      },
      { new: true }
    ).lean<GroupProjectLean | null>();
    refreshPublic(project.slug);
    return success(serializeBrief(updated?.brief));
  } catch (error) {
    return handleActionError("importLegacyBrief", error, ErrorMessages.FAILED_TO_UPDATE("brief"));
  }
}
