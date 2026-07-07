import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const presentationSlotSchema = new Schema(
  {
    team: { type: Schema.Types.ObjectId, required: true, ref: "Team" },
    // "HH:MM", local (Iceland = UTC) time on presentationDate
    startTime: { type: Schema.Types.String, required: true },
    endTime: { type: Schema.Types.String, required: true },
  },
  { _id: false }
);

const rubricItemSchema = new Schema(
  {
    key: { type: Schema.Types.String, required: true },
    title: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: false, default: "" },
    // Which color/judge-focus group the row belongs to (docs color coding).
    discipline: {
      type: Schema.Types.String,
      required: false,
      enum: ["design", "code", "general"],
      default: "general",
    },
  },
  { _id: false }
);

const groupProjectSchema = new Schema({
  title: { type: Schema.Types.String, required: true },
  description: { type: Schema.Types.String, required: false, default: "" },
  // Which module this project belongs to (1, 3, 4, 5, 6) — scopes the tech
  // stack choices students can pick during formation.
  module: { type: Schema.Types.Number, required: false, min: 0, max: 7 },
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
  // Presentation day and per-team time slots. When the day arrives the team
  // evaluation opens automatically; when the last slot ends the peer
  // evaluation opens automatically (see serverActions/groups/lifecycle.ts).
  presentationDate: { type: Schema.Types.Date, required: false },
  // Minutes per team presentation — the same for every team.
  presentationLength: { type: Schema.Types.Number, required: false, min: 5, max: 240 },
  presentationSlots: { type: [presentationSlotSchema], default: [] },
  // Per-project evaluation rubric; empty means the default categories.
  rubric: { type: [rubricItemSchema], default: [] },
  peerEvalOpen: { type: Schema.Types.Boolean, required: true, default: false },
  teamEvalOpen: { type: Schema.Types.Boolean, required: true, default: false },
  // Which automatic transitions have already fired. Each fires exactly once,
  // so a teacher can override the result (close a gate, revert the status)
  // without the next read re-applying it.
  autoApplied: {
    activated: { type: Schema.Types.Boolean, default: false },
    teamEvalOpened: { type: Schema.Types.Boolean, default: false },
    peerEvalOpened: { type: Schema.Types.Boolean, default: false },
  },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

groupProjectSchema.index({ status: 1, startDate: -1 });

export type GroupProjectType = InferSchemaType<typeof groupProjectSchema> & {
  _id: Types.ObjectId;
};

// Shape of `.lean()` results — what the server actions actually work with.
export type GroupProjectLean = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  module?: number | null;
  startDate: Date;
  endDate: Date;
  status: "formation" | "active" | "archived";
  presentationDate?: Date | null;
  presentationLength?: number | null;
  presentationSlots?: {
    team: Types.ObjectId;
    startTime: string;
    endTime: string;
  }[];
  rubric?: {
    key: string;
    title: string;
    description: string;
    discipline?: "design" | "code" | "general";
  }[];
  peerEvalOpen: boolean;
  teamEvalOpen: boolean;
  autoApplied?: {
    activated?: boolean;
    teamEvalOpened?: boolean;
    peerEvalOpened?: boolean;
  };
  createdBy?: Types.ObjectId;
  createdAt?: Date;
};

export type GroupProjectDocument = GroupProjectType & Document;
export const GroupProject =
  models.GroupProject ||
  model<GroupProjectDocument>("GroupProject", groupProjectSchema);
