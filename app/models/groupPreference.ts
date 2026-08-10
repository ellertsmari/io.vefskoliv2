import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const groupPreferenceSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "GroupProject",
    index: true,
  },
  user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  ambition: { type: Schema.Types.String, required: false, default: "" },
  focus: [{ type: Schema.Types.String }],
  techStack: [{ type: Schema.Types.String }],
  // When and where the student wants to work (SCHEDULE_/LOCATION_OPTIONS).
  // Added after the first projects ran, so older documents lack them — which
  // is exactly what `isPreferenceComplete` treats as "not filled in yet".
  schedule: { type: Schema.Types.String, required: false, default: "" },
  location: { type: Schema.Types.String, required: false, default: "" },
  about: { type: Schema.Types.String, required: false, default: "" },
  updatedAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

groupPreferenceSchema.index({ project: 1, user: 1 }, { unique: true });

export type GroupPreferenceType = InferSchemaType<
  typeof groupPreferenceSchema
> & {
  _id: Types.ObjectId;
};

export type GroupPreferenceDocument = GroupPreferenceType & Document;
export const GroupPreference =
  models.GroupPreference ||
  model<GroupPreferenceDocument>("GroupPreference", groupPreferenceSchema);
