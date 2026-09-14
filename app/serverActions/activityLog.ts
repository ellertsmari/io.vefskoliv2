"use server";

import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "../../auth";
import { Guide } from "models/guide";
import { User } from "models/user";
import { ActivityCycleModel } from "models/activityCycle";
import { ActivityEntryModel } from "models/activityEntry";
import { connectToDatabase } from "./mongoose-connector";
import { isActingAsTeacher } from "utils/userUtils";
import { activityCycleSchema, activityDateSchema, calculateActivityProgress, normalizeActivityName } from "utils/activityLog";
import { success, successNoData, failure, handleActionError, type ActionResult } from "utils/errors";
import type { ActivityCycle, ActivityEntry, ActivityEntryInput, ActivityLogData } from "types/activityLogTypes";

const idSchema = z.string().regex(/^[a-f0-9]{24}$/i);
const imageSchema = z.object({
  id: z.string().uuid().optional(),
  data: z.string().max(550000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/).optional(),
}).refine((v) => Boolean(v.id) !== Boolean(v.data), "Choose an existing image or upload a new one");
const entrySchema = z.object({
  id: idSchema.optional(), revision: z.number().int().min(0).optional(),
  guideId: idSchema, cycleId: idSchema,
  name: z.string().trim().min(2).max(160),
  location: z.string().trim().max(200),
  description: z.string().trim().max(5000),
  sessions: z.array(z.object({ date: activityDateSchema, minutes: z.number().int().min(1).max(1440) })).min(1).max(50),
  links: z.array(z.string().trim().max(2000).url().refine((s) => /^https?:\/\//i.test(s))).max(5),
  images: z.array(imageSchema).max(2),
  status: z.enum(["draft", "pending"]),
}).superRefine((v, ctx) => {
  if (v.id && v.revision === undefined) ctx.addIssue({ code: "custom", message: "Reload the activity before editing" });
  if (v.status === "pending" && (!v.description || !v.location || !v.images.length)) {
    ctx.addIssue({ code: "custom", message: "Add a description, location, and at least one image before submitting" });
  }
});

type CycleRow = Omit<ActivityCycle, "id" | "guideId"> & { _id: Types.ObjectId; guide: Types.ObjectId; locked?: boolean; updatedAt: Date };
type EntryRow = Omit<ActivityEntry, "id" | "ownerId" | "updatedAt"> & {
  _id: Types.ObjectId; owner: Types.ObjectId; updatedAt: Date;
  images?: { id: string; data: string }[];
};
const cycleDTO = (row: CycleRow): ActivityCycle => ({
  id: String(row._id), guideId: String(row.guide), label: row.label,
  activityCapMinutes: row.activityCapMinutes,
  locked: row.locked ?? false,
  periods: row.periods.map(({ id, label, startDate, endDate, targetMinutes }) => ({ id, label, startDate, endDate, targetMinutes })),
});
const entryDTO = (row: EntryRow): ActivityEntry => ({
  id: String(row._id), ownerId: String(row.owner), name: row.name,
  location: row.location, description: row.description,
  sessions: row.sessions.map(({ date, minutes }) => ({ date, minutes })),
  links: row.links, imageIds: row.imageIds, status: row.status,
  revision: row.revision, teacherComment: row.teacherComment,
  updatedAt: new Date(row.updatedAt).toISOString(),
});
const refresh = (guideId: string) => {
  revalidatePath(`/guides/${guideId}`);
  revalidatePath("/guides");
  revalidatePath("/LMS/dashboard");
  revalidatePath("/LMS/reports");
};

export async function getActivityLog(guideId: string, selectedCycleId?: string): Promise<ActionResult<ActivityLogData>> {
  const session = await auth();
  if (!session?.user?.id) return failure("Sign in to see your activity log.");
  if (!idSchema.safeParse(guideId).success || (selectedCycleId && !idSchema.safeParse(selectedCycleId).success)) return failure("Activity log not found.");
  try {
    await connectToDatabase();
    const guide = await Guide.findOne({ _id: guideId, submissionType: "activityLog" }).select("activityCycleId").lean<{ activityCycleId?: Types.ObjectId }>();
    if (!guide) return failure("Activity log not found.");
    const cycles = (await ActivityCycleModel.find({ guide: guideId }).sort({ createdAt: -1 }).lean<CycleRow[]>()).map(cycleDTO);
    const cycle = cycles.find((c) => c.id === (selectedCycleId ?? String(guide.activityCycleId))) ?? (selectedCycleId ? null : cycles[0] ?? null);
    if (selectedCycleId && !cycle) return failure("Reporting year not found.");
    const teacher = isActingAsTeacher(session);
    const data: ActivityLogData = { cycles, cycle, students: [], viewerId: session.user.id, teacher };
    if (!cycle) return success(data);
    const rows = await ActivityEntryModel.find({ guide: guideId, cycle: cycle.id, ...(!teacher ? { owner: session.user.id } : {}) }).sort({ createdAt: -1 }).lean<EntryRow[]>();
    const entries = rows.map(entryDTO);
    const people = teacher
      ? await User.find({ $or: [{ role: { $in: ["user", "student"] }, status: { $ne: "pending" } }, { _id: { $in: rows.map((r) => r.owner) } }] }).select("name").sort({ name: 1 }).lean<{ _id: Types.ObjectId; name: string }[]>()
      : [{ _id: new Types.ObjectId(session.user.id), name: session.user.name || "Your activities" }];
    data.students = people.map((p) => {
      const own = entries.filter((e) => e.ownerId === String(p._id));
      return { id: String(p._id), name: p.name, entries: own, progress: calculateActivityProgress(own, cycle) };
    });
    return success(data);
  } catch (error) {
    return handleActionError("getActivityLog", error, "Could not load the activity log. Please try again.");
  }
}

/** Cycles preserve historical rules. Once entries exist, create another year
 * rather than moving dates/targets under already approved work. */
export async function saveActivityCycle(guideId: string, input: unknown, cycleId?: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!isActingAsTeacher(session)) return failure("Only teachers can set up reporting years.");
  const parsed = activityCycleSchema.safeParse(input);
  if (!idSchema.safeParse(guideId).success || (cycleId && !idSchema.safeParse(cycleId).success) || !parsed.success) return failure(parsed.success ? "Invalid guide." : parsed.error.issues[0].message);
  try {
    await connectToDatabase();
    const guide = await Guide.findOne({ _id: guideId, submissionType: "activityLog" }).select("_id");
    if (!guide) return failure("Activity log not found.");
    if (cycleId && await ActivityEntryModel.exists({ cycle: cycleId })) return failure("This year already has activities. Its dates and targets are locked to preserve earned credit.");
    const existing = await ActivityCycleModel.find({ guide: guideId, ...(cycleId ? { _id: { $ne: cycleId } } : {}) }).lean<CycleRow[]>();
    const { periods } = parsed.data;
    if (existing.some((c) => c.periods.some((a) => periods.some((b) => a.startDate <= b.endDate && b.startDate <= a.endDate)))) return failure("These dates overlap another reporting year for this guide.");
    const cycle = cycleId
      ? await ActivityCycleModel.findOneAndUpdate({ _id: cycleId, guide: guideId, locked: { $ne: true } }, { $set: parsed.data }, { new: true, runValidators: true })
      : await ActivityCycleModel.create({ guide: guideId, ...parsed.data });
    if (!cycle) return failure("Reporting year not found or its rules have been locked by an activity. Reload to see the latest settings.");
    await Guide.updateOne({ _id: guideId }, { $set: { activityCycleId: cycle._id } });
    refresh(guideId);
    return successNoData("Reporting year saved.");
  } catch (error) {
    return handleActionError("saveActivityCycle", error, "Could not save the reporting year.");
  }
}

export async function saveActivityEntry(input: ActivityEntryInput): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id || isActingAsTeacher(session)) return failure("Sign in as a student to record an activity.");
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  const value = parsed.data;
  try {
    await connectToDatabase();
    const [guide, cycle] = await Promise.all([
      Guide.exists({ _id: value.guideId, submissionType: "activityLog" }),
      ActivityCycleModel.findOne({ _id: value.cycleId, guide: value.guideId }).lean<CycleRow>(),
    ]);
    if (!guide || !cycle) return failure("Activity log not found.");
    const today = new Date().toISOString().slice(0, 10);
    if (value.sessions.some((s) => s.date > today || !cycle.periods.some((p) => s.date >= p.startDate && s.date <= p.endDate))) return failure("Use activity dates within this reporting year, up to today.");
    const filter = { _id: value.id, owner: session.user.id, guide: value.guideId, cycle: value.cycleId, revision: value.revision };
    const previous = value.id ? await ActivityEntryModel.findOne(filter).select("+images").lean<EntryRow>() : null;
    if (value.id && !previous) return failure("This activity changed or is no longer available. Reload before editing.");
    const images: { id: string; data: string }[] = [];
    for (const image of value.images) {
      if (image.id) {
        const stored = previous?.images?.find((p) => p.id === image.id);
        if (!stored || images.some((p) => p.id === image.id)) return failure("An image is no longer available. Upload it again.");
        images.push({ id: stored.id, data: stored.data });
      } else if (image.data) {
        const data = image.data.slice("data:image/jpeg;base64,".length);
        const bytes = Buffer.from(data, "base64");
        if (bytes.length > 400000 || bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) return failure("Upload a valid JPEG image under 400 KB after compression.");
        images.push({ id: randomUUID(), data });
      }
    }
    const fields = {
      name: value.name, normalizedName: normalizeActivityName(value.name),
      location: value.location, description: value.description,
      sessions: value.sessions, links: value.links, images,
      imageIds: images.map((image) => image.id), status: value.status,
      teacherComment: "", reviewedAt: null, reviewedBy: null,
    };
    // Serialize the first accepted submission against settings edits. Later
    // submissions use the now immutable cycle rules without changing the lock.
    if (!cycle.locked) {
      const locked = await ActivityCycleModel.updateOne({ _id: cycle._id, updatedAt: cycle.updatedAt }, { $set: { locked: true } });
      if (locked.modifiedCount !== 1) return failure("The reporting-year settings changed. Reload and submit again.");
    }
    if (value.id) {
      const result = await ActivityEntryModel.updateOne(filter, { $set: fields, $inc: { revision: 1 } }, { runValidators: true });
      if (result.modifiedCount !== 1) return failure("This activity changed while you were editing. Reload and try again.");
    } else {
      await ActivityEntryModel.create({ ...fields, guide: value.guideId, cycle: value.cycleId, owner: session.user.id });
    }
    refresh(value.guideId);
    return successNoData(value.status === "draft" ? "Draft saved." : "Activity sent for approval.");
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) return failure("You already have an activity with that name. Edit it to add more dates or time.");
    return handleActionError("saveActivityEntry", error, "Could not save the activity. Your form is still here; please try again.");
  }
}

export async function deleteActivityEntry(guideId: string, entryId: string, revision: number): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id || isActingAsTeacher(session)) return failure("Only the student can delete their activity.");
  if (!idSchema.safeParse(entryId).success || !idSchema.safeParse(guideId).success || !Number.isInteger(revision)) return failure("Invalid activity.");
  try {
    await connectToDatabase();
    const result = await ActivityEntryModel.deleteOne({ _id: entryId, guide: guideId, owner: session.user.id, revision });
    if (!result.deletedCount) return failure("This activity changed. Reload and try again.");
    refresh(guideId);
    return successNoData("Activity deleted. Its hours have been removed from your totals.");
  } catch (error) { return handleActionError("deleteActivityEntry", error, "Could not delete the activity."); }
}

export async function reviewActivityEntries(guideId: string, cycleId: string, entries: { id: string; revision: number }[], decision: "approved" | "changesRequested", comment = ""): Promise<ActionResult<void>> {
  const session = await auth();
  if (!isActingAsTeacher(session)) return failure("Only teachers can review activities.");
  const parsed = z.object({ guideId: idSchema, cycleId: idSchema, entries: z.array(z.object({ id: idSchema, revision: z.number().int().min(0) })).min(1).max(100), decision: z.enum(["approved", "changesRequested"]), comment: z.string().trim().max(2000) }).safeParse({ guideId, cycleId, entries, decision, comment });
  if (!parsed.success) return failure("Invalid review.");
  if (decision === "changesRequested" && !parsed.data.comment) return failure("Tell the student what to change.");
  try {
    await connectToDatabase();
    const result = await ActivityEntryModel.bulkWrite(parsed.data.entries.map((entry) => ({ updateOne: {
      filter: { _id: new Types.ObjectId(entry.id), guide: new Types.ObjectId(guideId), cycle: new Types.ObjectId(cycleId), revision: entry.revision, status: { $in: ["pending", "approved"] } },
      update: { $set: { status: decision, teacherComment: parsed.data.comment, reviewedBy: session!.user!.id, reviewedAt: new Date() }, $inc: { revision: 1 } },
    } })));
    refresh(guideId);
    if (result.modifiedCount !== entries.length) return failure("Some activities changed during review. The others were updated; reload to review the remaining activities.");
    return successNoData(decision === "approved" ? "Activities approved. Credit updated." : "Changes requested. Credit updated.");
  } catch (error) { return handleActionError("reviewActivityEntries", error, "Could not save the review."); }
}
