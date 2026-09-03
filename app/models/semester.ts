import {
  Document,
  InferSchemaType,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

/**
 * The term the calendar shows. One document is `active` at a time; saving a
 * new active semester deactivates the old one. Dates are "YYYY-MM-DD" strings
 * like the events. Only teachers write here.
 */
const semesterSchema = new Schema(
  {
    label: { type: Schema.Types.String, required: true },
    startDate: { type: Schema.Types.String, required: true },
    endDate: { type: Schema.Types.String, required: true },
    spann2Start: { type: Schema.Types.String, required: false },
    active: { type: Schema.Types.Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

export type SemesterType = InferSchemaType<typeof semesterSchema> & {
  _id: Types.ObjectId;
};
export type SemesterDocument = SemesterType & Document;

export const Semester =
  models?.Semester || model<SemesterDocument>("Semester", semesterSchema);
