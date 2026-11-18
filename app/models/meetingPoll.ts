import "models/autoConnect";
import {
  Document,
  InferSchemaType,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

/**
 * "Find a time": a few candidate days and an hour range, on which everyone
 * invited marks when they are free. The organiser then picks the time that
 * suits most, which turns the poll into an ordinary calendar event and
 * removes the poll.
 *
 * Dates are "YYYY-MM-DD" and times "HH:MM". A response is the list of grid
 * cells the person is free in, each "YYYY-MM-DD HH:MM" (the cell's start);
 * the cell size follows from the meeting length (see utils/meetingUtils).
 */
const responseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cells: { type: [Schema.Types.String], default: [] },
    at: { type: Schema.Types.Date, required: true, default: Date.now },
  },
  { _id: false }
);

const meetingPollSchema = new Schema(
  {
    title: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: false },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    days: { type: [Schema.Types.String], required: true },
    dayStart: { type: Schema.Types.String, required: true },
    dayEnd: { type: Schema.Types.String, required: true },
    lengthMinutes: { type: Schema.Types.Number, required: true },
    audience: {
      type: Schema.Types.String,
      required: true,
      enum: ["everyone", "team", "shared"],
    },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: false },
    sharedWith: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    responses: { type: [responseSchema], default: [] },
  },
  { timestamps: true }
);

export type MeetingPollType = InferSchemaType<typeof meetingPollSchema> & {
  _id: Types.ObjectId;
};
export type MeetingPollDocument = MeetingPollType & Document;

export const MeetingPoll =
  models?.MeetingPoll ||
  model<MeetingPollDocument>("MeetingPoll", meetingPollSchema);
