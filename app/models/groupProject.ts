import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const groupProjectSchema = new Schema({
  title: { type: Schema.Types.String, required: true },
  description: { type: Schema.Types.String, required: false, default: "" },
  startDate: { type: Schema.Types.Date, required: true },
  endDate: { type: Schema.Types.Date, required: true },
  // formation: students fill preferences, teachers compose teams
  // active: teams locked, team hubs editable
  // archived: read-only history
  status: {
    type: Schema.Types.String,
    required: true,
    enum: ["formation", "active", "archived"],
    default: "formation",
  },
  peerEvalOpen: { type: Schema.Types.Boolean, required: true, default: false },
  teamEvalOpen: { type: Schema.Types.Boolean, required: true, default: false },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

groupProjectSchema.index({ status: 1, startDate: -1 });

export type GroupProjectType = InferSchemaType<typeof groupProjectSchema> & {
  _id: Types.ObjectId;
};

export type GroupProjectDocument = GroupProjectType & Document;
export const GroupProject =
  models.GroupProject ||
  model<GroupProjectDocument>("GroupProject", groupProjectSchema);
