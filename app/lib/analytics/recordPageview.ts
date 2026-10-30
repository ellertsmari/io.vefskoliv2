import { createHash, randomBytes } from "node:crypto";
import { AnalyticsSalt } from "models/analyticsSalt";
import { Pageview } from "models/pageview";
import { connectToDatabase } from "serverActions/mongoose-connector";
import {
  campaignSource,
  agentFor,
  classifyRequest,
  dayKey,
  deviceClass,
  endOfDay,
  referrerHost,
  type PageviewSnapshot,
} from "utils/analytics";

/**
 * The anonymous id of one visitor on one day.
 *
 * Same IP and browser on the same day → same id, so a visitor reading five
 * guides counts once. Next day's salt is unrelated, so ids cannot be linked
 * across days. Truncated to 64 bits: plenty to keep a day's visitors apart,
 * and less of a fingerprint than a full digest.
 */
export const visitorHash = (salt: string, ip: string, userAgent: string) =>
  createHash("sha256")
    .update(`${salt}\n${ip}\n${userAgent}`)
    .digest("hex")
    .slice(0, 16);

/**
 * Per instance, so a warm lambda asks the database for the salt once a day
 * rather than once a request. On globalThis for the same reason as the
 * connection cache: dev hot reloads would otherwise drop it.
 */
const globalWithSalt = globalThis as typeof globalThis & {
  _analyticsSalt?: { day: string; salt: string };
};

const isDuplicateKey = (error: unknown) =>
  (error as { code?: number })?.code === 11000;

/**
 * Today's salt, created by whichever request asks first. The upsert only
 * sets the salt on insert, so concurrent first requests on different
 * instances all end up reading the same row.
 */
export async function getDailySalt(day: string): Promise<string> {
  const cached = globalWithSalt._analyticsSalt;
  if (cached?.day === day) return cached.salt;

  const upsert = () =>
    AnalyticsSalt.findOneAndUpdate(
      { day },
      {
        $setOnInsert: {
          salt: randomBytes(32).toString("hex"),
          expiresAt: endOfDay(day),
        },
      },
      { upsert: true, new: true, lean: true }
    );

  let row;
  try {
    row = await upsert();
  } catch (error) {
    // Two first-ever requests of the day can race to insert; the loser
    // retries and finds the winner's row.
    if (isDuplicateKey(error)) row = await upsert();
    else throw error;
  }
  if (!row) throw new Error("Could not create today's analytics salt");

  globalWithSalt._analyticsSalt = { day, salt: row.salt };
  return row.salt;
}

/** Turns a snapshot into the row that is stored. Exported for tests. */
export async function toPageview(hit: PageviewSnapshot) {
  const day = dayKey(hit.at);
  const bot = classifyRequest(hit.userAgent, hit.hasAcceptLanguage);
  return {
    at: hit.at,
    day,
    path: hit.path,
    source: campaignSource(new URLSearchParams(hit.search)),
    referrer: referrerHost(hit.referrer, hit.host),
    country: hit.country,
    city: hit.city,
    device: bot ? null : deviceClass(hit.userAgent),
    bot,
    agent: agentFor(bot, hit.userAgent),
    visitor: bot
      ? null
      : visitorHash(await getDailySalt(day), hit.ip, hit.userAgent),
  };
}

/**
 * Store one page view. Never throws: this runs after the visitor already has
 * their page, and an analytics failure must not surface anywhere but the log.
 * ANALYTICS_DISABLED=1 turns recording off without a deploy of code.
 */
export async function recordPageview(hit: PageviewSnapshot): Promise<void> {
  if (process.env.ANALYTICS_DISABLED === "1") return;
  try {
    await connectToDatabase();
    await Pageview.create(await toPageview(hit));
  } catch (error) {
    console.error(
      "[analytics] could not record a page view:",
      error instanceof Error ? error.message : error
    );
  }
}
