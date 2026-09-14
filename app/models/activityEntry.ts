import { Schema, model, models } from "mongoose";

const activityEntrySchema = new Schema({
  guide: { type: Schema.Types.ObjectId, ref: "Guide", required: true },
  cycle: { type: Schema.Types.ObjectId, ref: "ActivityCycle", required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  normalizedName: { type: String, required: true },
  location: { type: String, default: "" },
  description: { type: String, default: "" },
  sessions: [{ _id: false, date: { type: String, required: true }, minutes: { type: Number, required: true } }],
  links: [String],
  // Bounded, private JPEG evidence. Excluded from ordinary queries and all
  // progress payloads; served only by the authenticated image route. Saving
  // bytes with the entry keeps updates/deletions atomic without orphan uploads.
  images: { type: [{ _id: false, id: String, data: String }], select: false },
  imageIds: [String],
  status: { type: String, enum: ["draft", "pending", "approved", "changesRequested"], default: "draft", required: true },
  revision: { type: Number, default: 0, required: true },
  teacherComment: { type: String, default: "" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
}, { timestamps: true });
activityEntrySchema.index({ guide: 1, cycle: 1, owner: 1 });
activityEntrySchema.index({ cycle: 1, owner: 1, normalizedName: 1 }, { unique: true });

export const ActivityEntryModel = models.ActivityEntry || model("ActivityEntry", activityEntrySchema);
