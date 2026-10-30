import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * Today's salt for anonymous visitor ids. One row per day, random, and
 * deleted by the TTL monitor shortly after the day ends.
 *
 * It has to live somewhere shared: on Vercel two requests from one visitor can
 * land on different instances, and both must hash to the same id or every
 * visitor counts twice. Once the row is gone, nothing — not even a copy of
 * the database — can link that day's ids back to an IP address, because
 * guessing an address means knowing the salt.
 */
const analyticsSaltSchema = new Schema({
  day: { type: Schema.Types.String, required: true, unique: true },
  salt: { type: Schema.Types.String, required: true },
  expiresAt: { type: Schema.Types.Date, required: true },
});

analyticsSaltSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AnalyticsSaltType = InferSchemaType<typeof analyticsSaltSchema>;

export const AnalyticsSalt: Model<AnalyticsSaltType> =
  models?.AnalyticsSalt ||
  model<AnalyticsSaltType>("AnalyticsSalt", analyticsSaltSchema);
