import { Schema, model, models } from "mongoose";

const activityCycleSchema = new Schema({
  guide: { type: Schema.Types.ObjectId, ref: "Guide", required: true, index: true },
  label: { type: String, required: true },
  locked: { type: Boolean, default: false },
  activityCapMinutes: { type: Number, required: true, min: 1 },
  periods: { type: [{
    _id: false,
    id: { type: String, required: true },
    label: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    targetMinutes: { type: Number, required: true, min: 1 },
  }], required: true },
}, { timestamps: true });
activityCycleSchema.index({ guide: 1, label: 1 }, { unique: true });

export const ActivityCycleModel = models.ActivityCycle || model("ActivityCycle", activityCycleSchema);
