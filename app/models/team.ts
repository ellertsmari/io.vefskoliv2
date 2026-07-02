import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const teamSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "GroupProject",
    index: true,
  },
  name: { type: Schema.Types.String, required: true, default: "New Team" },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  projectName: { type: Schema.Types.String, required: false, default: "" },
  projectDescription: {
    type: Schema.Types.String,
    required: false,
    default: "",
  },
  links: {
    github: { type: Schema.Types.String, required: false, default: "" },
    figma: { type: Schema.Types.String, required: false, default: "" },
    figjam: { type: Schema.Types.String, required: false, default: "" },
    website: { type: Schema.Types.String, required: false, default: "" },
    backend: { type: Schema.Types.String, required: false, default: "" },
  },
  // Image URLs (max 3), same URL-paste approach as Return.pictureUrl
  images: [{ type: Schema.Types.String }],
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

teamSchema.index({ project: 1, members: 1 });

export type TeamType = InferSchemaType<typeof teamSchema> & {
  _id: Types.ObjectId;
};

export type TeamDocument = TeamType & Document;
export const Team = models.Team || model<TeamDocument>("Team", teamSchema);
