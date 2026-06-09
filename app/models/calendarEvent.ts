import {
  Document,
  InferSchemaType,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

/**
 * A calendar event.
 *
 * Dates are stored as "YYYY-MM-DD" strings and times as "HH:MM" strings —
 * the calendar deals in school-local wall-clock dates, and strings sidestep
 * timezone drift entirely (a holiday on Dec 24 is Dec 24 for everyone).
 *
 * Timed categories (lecture, module2) use a single day (startDate === endDate)
 * with start/end times. Ranged categories (guide, groupwork, holiday) span
 * whole days from startDate to endDate inclusive, with no times.
 *
 * `owner: null` marks an imported/school event (seeded semester plan): only
 * teachers can edit those. Otherwise owner is the creating user; students may
 * edit/delete only their own events, teachers may edit/delete anything.
 */
const calendarEventSchema = new Schema(
  {
    title: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: false },
    category: {
      type: Schema.Types.String,
      required: true,
      enum: ["guide", "lecture", "groupwork", "module2", "holiday"],
    },
    startDate: { type: Schema.Types.String, required: true, index: true },
    endDate: { type: Schema.Types.String, required: true },
    startTime: { type: Schema.Types.String, required: false },
    endTime: { type: Schema.Types.String, required: false },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    // "everyone": visible to all logged-in users.
    // "restricted": visible to the owner, the users in sharedWith, and teachers.
    visibility: {
      type: Schema.Types.String,
      required: true,
      enum: ["everyone", "restricted"],
      default: "everyone",
    },
    sharedWith: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true }
);

export type CalendarEventType = InferSchemaType<typeof calendarEventSchema> & {
  _id: Types.ObjectId;
};

export type CalendarEventDocument = CalendarEventType & Document;

export const CalendarEvent =
  models.CalendarEvent ||
  model<CalendarEventDocument>("CalendarEvent", calendarEventSchema);
