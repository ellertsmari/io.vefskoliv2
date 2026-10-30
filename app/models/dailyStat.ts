import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * Totals for one finished day, rolled up from `pageviews` (see
 * app/lib/analytics/stats.ts). These are kept for good, so the trend survives
 * after the raw rows expire. A day is only rolled up once it is over; today is
 * always counted live.
 */
const dailyStatSchema = new Schema({
  day: { type: Schema.Types.String, required: true, unique: true },
  /** Page views by people. */
  views: { type: Schema.Types.Number, required: true },
  /** Distinct anonymous visitors that day. */
  visitors: { type: Schema.Types.Number, required: true },
  /** Fetches by crawlers of any kind. */
  crawlerHits: { type: Schema.Types.Number, required: true },
});

export type DailyStatType = InferSchemaType<typeof dailyStatSchema>;

export const DailyStat: Model<DailyStatType> =
  models?.DailyStat ||
  model<DailyStatType>("DailyStat", dailyStatSchema, "dailystats");
