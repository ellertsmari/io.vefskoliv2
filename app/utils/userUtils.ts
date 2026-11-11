import { Session } from "next-auth";

/**
 * Two questions, deliberately kept apart.
 *
 * A teacher can "view as" another user. While they do, the session's `user`
 * is that other user (role included) and the teacher's own account sits in
 * `originalUser`. The rule, decided 2026-11-09: while viewing as a student the
 * teacher sees and can do exactly what that student can, nothing more. The
 * powers come back the moment they switch back.
 *
 *   - `isActingAsTeacher` is the one to use for permissions and for what the
 *     page shows. It reads the effective role.
 *   - `isTeacherAccount` is only for the view-as controls themselves, which
 *     must keep working while aliased or there would be no way back.
 */

/** Should this request be treated as a teacher's? False while viewing as a student. */
export function isActingAsTeacher(session: Session | null): boolean {
  return session?.user?.role === "teacher";
}

/** Is the signed-in account really a teacher's, whoever they are viewing as? */
export function isTeacherAccount(session: Session | null): boolean {
  if (!session?.user) return false;
  const account =
    session.user.isAliased && session.user.originalUser
      ? session.user.originalUser
      : session.user;
  return account.role === "teacher";
}
