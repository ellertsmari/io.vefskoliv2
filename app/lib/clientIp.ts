import { headers } from "next/headers";

/**
 * The address the current request came from, as Vercel reports it.
 *
 * `x-forwarded-for` is set by the platform in front of us, and its first entry
 * is the client. Only used to key rate limits, so a missing header degrades
 * to one shared bucket rather than an error, which is what happens on a
 * bare `next dev`.
 */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || requestHeaders.get("x-real-ip")?.trim() || "unknown";
}
