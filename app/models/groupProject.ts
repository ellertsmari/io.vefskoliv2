import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";
import { BRIEF_SECTION_KEYS, BriefSectionKey } from "constants/projectBrief";

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

const briefSectionSchema = new Schema(
  {
    key: {
      type: Schema.Types.String,
      required: true,
      enum: BRIEF_SECTION_KEYS as unknown as string[],
    },
    title: { type: Schema.Types.String, default: "" },
    // Sanitised HTML (utils/briefHtml) — never stored raw.
    html: { type: Schema.Types.String, default: "" },
  },
  { _id: false }
);

const briefThemeSchema = new Schema(
  {
    background: { type: Schema.Types.String, default: "" },
    surface: { type: Schema.Types.String, default: "" },
    text: { type: Schema.Types.String, default: "" },
    muted: { type: Schema.Types.String, default: "" },
    accent: { type: Schema.Types.String, default: "" },
    accentText: { type: Schema.Types.String, default: "" },
    heroBackground: { type: Schema.Types.String, default: "" },
    heroText: { type: Schema.Types.String, default: "" },
    headingFont: { type: Schema.Types.String, default: "" },
    bodyFont: { type: Schema.Types.String, default: "" },
  },
  { _id: false }
);

const groupProjectSchema = new Schema({
  title: { type: Schema.Types.String, required: true },
  // The old one-block Markdown brief. Shown until `brief` has sections, and
  // the source for importing them.
  description: { type: Schema.Types.String, required: false, default: "" },
  // The public brief page lives at /projects/<slug>. Unique by check in
  // manageBrief, not by index: a handful of documents, set once.
  slug: { type: Schema.Types.String, required: false },
  // Public once published AND past formation (see getPublicBriefs).
  published: { type: Schema.Types.Boolean, default: false },
  brief: {
    tagline: { type: Schema.Types.String, default: "" },
    coverImage: { type: Schema.Types.String, default: "" },
    teamSize: { type: Schema.Types.String, default: "" },
    sections: { type: [briefSectionSchema], default: [] },
    theme: { type: briefThemeSchema, default: () => ({}) },
    updatedAt: { type: Schema.Types.Date, required: false },
  },
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
  // Share of each score carried by the panel (teachers + invited judges); the
  // student audience carries the rest. 0.8 by default, 1 for projects where
  // the students' scores are practice rather than part of the grade.
  panelWeight: {
    type: Schema.Types.Number,
    required: true,
    default: 0.8,
    min: 0,
    max: 1,
  },
  peerEvalOpen: { type: Schema.Types.Boolean, required: true, default: false },
  teamEvalOpen: { type: Schema.Types.Boolean, required: true, default: false },
  // Written feedback reaches a student as soon as they have handed in their
  // own evaluations; the scores wait for a teacher to release them, which is a
  // separate decision from the project being over (the evaluation gates stay
  // open after that, for whoever is late).
  gradesReleased: {
    type: Schema.Types.Boolean,
    required: true,
    default: false,
  },
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
  panelWeight?: number;
  peerEvalOpen: boolean;
  teamEvalOpen: boolean;
  gradesReleased?: boolean;
  autoApplied?: {
    activated?: boolean;
    teamEvalOpened?: boolean;
    peerEvalOpened?: boolean;
  };
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  slug?: string;
  published?: boolean;
  brief?: {
    tagline?: string;
    coverImage?: string;
    teamSize?: string;
    sections?: { key: BriefSectionKey; title?: string; html?: string }[];
    theme?: Record<string, string>;
    updatedAt?: Date;
  };
};

export type GroupProjectDocument = GroupProjectType & Document;
export const GroupProject =
  models.GroupProject ||
  model<GroupProjectDocument>("GroupProject", groupProjectSchema);
