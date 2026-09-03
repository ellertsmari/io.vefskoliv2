import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * One counter per rate-limit key: how many times something happened inside
 * the window that ends at `expiresAt`. MongoDB's TTL monitor deletes the row
 * shortly after that, so the collection never needs tidying and a key that
 * comes back later starts a fresh window.
 *
 * Keys are hashes (see `utils/rateLimit`), so no email address or IP is ever
 * stored here in clear.
 */
const rateLimitSchema = new Schema({
  key: { type: Schema.Types.String, required: true, unique: true },
  count: { type: Schema.Types.Number, required: true },
  expiresAt: { type: Schema.Types.Date, required: true },
});

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitType = InferSchemaType<typeof rateLimitSchema>;

export const RateLimit: Model<RateLimitType> =
  models?.RateLimit || model<RateLimitType>("RateLimit", rateLimitSchema);
