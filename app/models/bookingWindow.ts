import {
  Document,
  InferSchemaType,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

/**
 * A weekly window in which students may book a meeting with the teachers,
 * e.g. Tuesdays 13:00–15:00 from 5 October to 18 December. Windows belong
 * to the teacher team, not to one teacher: a slot inside a window is offered
 * only when enough teachers have no "unavailable" event at that time (see
 * serverActions/meetings). Times are "HH:MM", dates "YYYY-MM-DD".
 */
const bookingWindowSchema = new Schema(
  {
    /** 0 = Monday … 6 = Sunday. */
    weekday: { type: Schema.Types.Number, required: true, min: 0, max: 6 },
    startTime: { type: Schema.Types.String, required: true },
    endTime: { type: Schema.Types.String, required: true },
    validFrom: { type: Schema.Types.String, required: true },
    validTo: { type: Schema.Types.String, required: true, index: true },
  },
  { timestamps: true }
);

export type BookingWindowType = InferSchemaType<typeof bookingWindowSchema> & {
  _id: Types.ObjectId;
};
export type BookingWindowDocument = BookingWindowType & Document;

export const BookingWindow =
  models?.BookingWindow ||
  model<BookingWindowDocument>("BookingWindow", bookingWindowSchema);
