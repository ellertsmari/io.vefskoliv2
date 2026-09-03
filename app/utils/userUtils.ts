import { Session } from "next-auth";

/**
 * Gets the original user role, which is useful for determining permissions
 * even when a teacher is aliasing as a student
 */
function getOriginalUserRole(session: Session | null): string | undefined {
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
 * Whether the viewer should be treated as a teacher right now. Differs from
 * `hasTeacherPermissions` while a teacher is viewing as a student: teacher
 * tools stay reachable, but anything that acts on the aliased student's
 * behalf (returns, reviews, calendar events) behaves as that student would.
 */
export function isActingAsTeacher(session: Session | null): boolean {
  return hasTeacherPermissions(session) && !session?.user?.isAliased;
}
