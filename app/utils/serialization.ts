/**
 * A MongoDB value as plain JSON, ready to hand to a client component.
 * JSON.stringify already turns ObjectIds into hex strings, Dates into ISO
 * strings and mongoose documents into plain objects (all via toJSON).
 */
export function safeSerialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * A stored date as an ISO string, whatever shape it was stored in. Guides
 * imported by hand carry `updatedAt` as a string or not at all, and calling
 * toISOString on those took the whole editor list down with it. Anything
 * unreadable becomes the epoch rather than an exception.
 */
export function isoDate(value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}
