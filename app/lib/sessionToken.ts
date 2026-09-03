import type { JWT } from "next-auth/jwt";
import { User, type UserDocument } from "models/user";
import { connectToDatabase } from "serverActions/mongoose-connector";

/**
 * The session token carries the user's role and profile so that rendering a
 * page needs no database round trip. The price is that the token is a
 * snapshot: this is how stale it may get before the next request re-reads
 * the user. Deleting or demoting an account takes effect within this long.
 */
export const REVALIDATE_AFTER_MS = 15 * 60 * 1000;

/** Copy what the session needs from the user document onto the token. */
export function snapshotUser(token: JWT, dbuser: UserDocument): JWT {
  token.id = dbuser.id.toString();
  token.role = dbuser.role;
  token.avatarUrl = dbuser.avatarUrl ?? undefined;
  token.background = dbuser.background ?? undefined;
  token.careerGoals = dbuser.careerGoals ?? undefined;
  token.email = dbuser.email;
  token.favoriteArtists = dbuser.favoriteArtists ?? undefined;
  token.interests = dbuser.interests ?? undefined;
  token.name = dbuser.name;
  token.checkedAt = Date.now();
  return token;
}

/**
 * Bring an existing token up to date with the database now and then.
 *
 * Returns the token untouched while the last check is recent, a refreshed
 * token when the account is still active, and `null` (which Auth.js treats
 * as "signed out") when the account is gone or no longer active. Tokens
 * issued before `checkedAt` existed have none and are checked at once.
 */
export async function refreshToken(token: JWT): Promise<JWT | null> {
  const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
  if (Date.now() - checkedAt < REVALIDATE_AFTER_MS) return token;
  if (!token.id) return null;

  try {
    await connectToDatabase();
    const dbuser: UserDocument | null = await User.findById(token.id);
    if (!dbuser || dbuser.status !== "active") return null;
    return snapshotUser(token, dbuser);
  } catch (error) {
    // A database blip should not log everyone out; try again next time.
    console.error("Error re-validating session:", error);
    return token;
  }
}
