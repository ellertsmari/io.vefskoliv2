import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

/**
 * The Canvas assignment (AGS "line item") that one guide maps to in one course.
 *
 * A guide has many of these — one per course it is taught in, so module 3's code
 * guides each hold a line item in VFOR4WD03AA and another in VFOR4WD03BA.
 *
 * This exists so grade passback does not depend on `LTILaunch`. The original
 * grades route looked the target up by (student, context, resourceLink), which
 * silently requires every student to have opened every assignment from Canvas
 * before their grade can be sent — fine for a launch-driven tool, useless for a
 * sync that runs when a teacher grades. Line items are course-scoped, so once
 * this row exists, scores can be pushed for any student on the roster.
 */
const canvasLineItemSchema = new Schema(
  {
    guide: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Guide",
      index: true,
    },
    contextId: { type: Schema.Types.String, required: true, index: true },

    // The AGS line item URL. Scores are POSTed to `${lineitemUrl}/scores`.
    lineitemUrl: { type: Schema.Types.String, required: true },

    // Mirrors the line item's `scoreMaximum` in Canvas. Stored so a mismatch
    // between our 0..10 scale and a column someone rescaled by hand in Canvas is
    // detectable instead of silently producing wrong percentages.
    scoreMaximum: { type: Schema.Types.Number, required: true, default: 10 },

    label: { type: Schema.Types.String, required: false },

    // Set when the line item came from a deep-linking selection rather than
    // being created by us through the AGS API; kept for troubleshooting a
    // Canvas column nobody can account for.
    resourceLinkId: { type: Schema.Types.String, required: false },
  },
  { timestamps: true }
);

// One column per guide per course.
canvasLineItemSchema.index({ guide: 1, contextId: 1 }, { unique: true });

export type CanvasLineItemType = InferSchemaType<typeof canvasLineItemSchema> & {
  _id: Types.ObjectId;
};
export type CanvasLineItemDocument = CanvasLineItemType & Document;

export const CanvasLineItem =
  models?.CanvasLineItem ||
  model<CanvasLineItemDocument>("CanvasLineItem", canvasLineItemSchema);
