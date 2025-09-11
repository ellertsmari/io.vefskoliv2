import { Session } from "next-auth";

/**
 * Gets the original user role, which is useful for determining permissions
 * even when a teacher is aliasing as a student
 */
export function getOriginalUserRole(session: Session | null): string | undefined {
  if (!session?.user) return undefined;
  
  // If the user is aliased, return the original user's role
  if (session.user.isAliased && session.user.originalUser) {
    return session.user.originalUser.role;
  }
  
  // Otherwise return the current user's role
  return session.user.role;
}

/**
 * Checks if the user has teacher permissions (either as a teacher or aliased teacher)
 */
export function hasTeacherPermissions(session: Session | null): boolean {
  return getOriginalUserRole(session) === "teacher";
}

/**
 * Gets the current effective user (the user being displayed/used)
 */
export function getEffectiveUser(session: Session | null) {
  return session?.user;
}

/**
 * Gets the original user (the user who is actually logged in)
 */
export function getOriginalUser(session: Session | null) {
  if (!session?.user) return null;
  
  if (session.user.isAliased && session.user.originalUser) {
    return session.user.originalUser;
  }
  
  return session.user;
}