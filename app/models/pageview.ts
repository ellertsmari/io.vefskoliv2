import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { RETENTION_DAYS } from "utils/analytics";

/**
 * One page view by a member of the public, or one fetch by a crawler.
 *
 * Written by the proxy for logged-out traffic only (see
 * app/lib/analytics/recordPageview.ts). There is no IP address and no user
 * agent string in here (only an unnamed bot's own name, in `agent`):
 * `visitor` is a hash keyed by a salt that is deleted when the day ends, so
 * rows from different days cannot be linked to each other or to anyone.
 *
 * Rows expire after RETENTION_DAYS. Totals per day outlive them in
 * `dailystats`. Changing RETENTION_DAYS does NOT change the TTL index of an
 * existing collection — MongoDB keeps the old expireAfterSeconds until it is
 * changed with collMod (Compass: Indexes → edit the `at_1` index).
 */
const pageviewSchema = new Schema({
  at: { type: Schema.Types.Date, required: true },
  /** "YYYY-MM-DD", UTC — Iceland's local day. Every query filters on it. */
  day: { type: Schema.Types.String, required: true },
  path: { type: Schema.Types.String, required: true },
  /** Campaign tag from ?utm_source= or ?ref=, when the link carried one. */
  source: { type: Schema.Types.String, default: null },
  /** Host of an external referrer; null for direct visits and internal clicks. */
  referrer: { type: Schema.Types.String, default: null },
  /** ISO 3166 alpha-2, from Vercel's geo headers. */
  country: { type: Schema.Types.String, default: null },
  city: { type: Schema.Types.String, default: null },
  /** desktop / mobile / tablet; null for crawlers. */
  device: { type: Schema.Types.String, default: null },
  /** Crawler label (see utils/analytics CRAWLERS); null for people. */
  bot: { type: Schema.Types.String, default: null },
  /**
   * What a bot we don't name calls itself ("Barkrowler", "python-requests"),
   * so "Other bot" can be broken down. Null for people and named crawlers.
   */
  agent: { type: Schema.Types.String, default: null },
  /** Anonymous per-day visitor id; null for crawlers, which are not visitors. */
  visitor: { type: Schema.Types.String, default: null },
});

pageviewSchema.index(
  { at: 1 },
  { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 }
);
pageviewSchema.index({ day: 1, path: 1 });
pageviewSchema.index({ day: 1, bot: 1 });

export type PageviewType = InferSchemaType<typeof pageviewSchema>;

export const Pageview: Model<PageviewType> =
  models?.Pageview || model<PageviewType>("Pageview", pageviewSchema);
