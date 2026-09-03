import { createHash } from "node:crypto";
import { RateLimit } from "models/rateLimit";
import { connectToDatabase } from "serverActions/mongoose-connector";

/**
 * Fixed-window rate limiting on top of MongoDB.
 *
 * The app runs on Vercel, where every request may land on a fresh instance,
 * so an in-memory counter would reset all the time. MongoDB is already there
 * and a TTL index does the expiry for us, which keeps this at one round trip
 * per check and no extra service.
 *
 * Callers pass a key from `rateLimitKey`, never a raw email or IP.
 */

export type RateLimitState = {
  /** True when this call fit inside the limit. */
  allowed: boolean;
  /** Seconds until the window ends; 0 when allowed. */
  retryAfterSeconds: number;
};

/**
 * A stable, opaque key for one thing being limited. The scope keeps counters
 * for different purposes apart ("login:email" vs "signup:ip"), and hashing
 * means the collection holds nothing personal.
 */
export function rateLimitKey(scope: string, identifier: string): string {
  return createHash("sha256")
    .update(`${scope} ${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

const secondsUntil = (date: Date): number =>
  Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));

/**
 * Count one event against `key` and say whether it was within `limit` for the
 * current window. The window starts at the first event and lasts
 * `windowSeconds`; later events do not extend it.
 *
 * The update is a single pipeline so it is atomic: an expired but not yet
 * deleted row is restarted in place instead of colliding with an insert.
 */
export async function consume(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitState> {
  await connectToDatabase();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);
  const stillOpen = { $gt: ["$expiresAt", now] };

  const update = () =>
    RateLimit.findOneAndUpdate(
      { key },
      [
        {
          $set: {
            count: { $cond: [stillOpen, { $add: ["$count", 1] }, 1] },
            expiresAt: { $cond: [stillOpen, "$expiresAt", windowEnd] },
          },
        },
      ],
      { upsert: true, new: true, lean: true }
    );

  let row;
  try {
    row = await update();
  } catch (error) {
    // Two first-ever calls for the same key can race to insert. The loser
    // gets a duplicate-key error; on retry the row exists and it increments.
    if (isDuplicateKey(error)) row = await update();
    else throw error;
  }

  if (!row || row.count <= limit) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: secondsUntil(row.expiresAt) };
}

/**
 * Whether `key` has already reached `limit` in its current window, without
 * counting anything. Lets a caller refuse an attempt before doing the work
 * (and before deciding whether the attempt counts as a failure).
 */
export async function isLimited(
  key: string,
  limit: number
): Promise<RateLimitState> {
  await connectToDatabase();
  const row = await RateLimit.findOne({
    key,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!row || row.count < limit) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: secondsUntil(row.expiresAt) };
}

/** Forget everything counted against `key`. */
export async function reset(key: string): Promise<void> {
  await connectToDatabase();
  await RateLimit.deleteOne({ key });
}

const isDuplicateKey = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === 11000;
