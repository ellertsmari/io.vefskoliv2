import { del } from "@vercel/blob";
import { isBlobImage } from "utils/imageUpload";
import { logError } from "utils/errors";

/**
 * Delete images that a save has just orphaned.
 *
 * Called from the actions that persist image fields, comparing what was in the
 * document against what is being written. Doing the cleanup here rather than
 * from the browser means it is authorised by the same check as the write
 * itself — a user can only ever delete images belonging to a record they were
 * already allowed to edit — and it covers replacement as well as removal, so
 * the store does not silently accumulate every superseded upload.
 *
 * Only URLs in our own blob store are touched: legacy data URLs live inside
 * the document and disappear with it, and a pasted third-party link is not
 * ours to delete.
 *
 * Failures are logged, never thrown. An orphaned blob is a few hundred KB of
 * waste; a save that fails because cleanup failed would lose a student's work.
 */
export async function deleteReplacedImages(
  previous: (string | undefined)[],
  next: (string | undefined)[]
): Promise<void> {
  const keep = new Set(next.filter(Boolean) as string[]);
  const orphaned = [
    ...new Set(
      previous.filter(
        (value): value is string =>
          !!value && !keep.has(value) && isBlobImage(value)
      )
    ),
  ];
  if (orphaned.length === 0) return;

  try {
    await del(orphaned);
  } catch (error) {
    logError("deleteReplacedImages", error, { count: orphaned.length });
  }
}
