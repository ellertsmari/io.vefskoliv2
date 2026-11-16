import type { Session } from "next-auth";
import { isActingAsTeacher, isTeacherAccount } from "utils/userUtils";

const session = (user: Record<string, unknown>) =>
  ({ user, expires: "" }) as unknown as Session;

const teacher = session({ id: "t", role: "teacher", isAliased: false });
const student = session({ id: "s", role: "user", isAliased: false });
const teacherAsStudent = session({
  id: "s",
  role: "user",
  isAliased: true,
  originalUser: { id: "t", role: "teacher" },
});
const teacherAsTeacher = session({
  id: "t2",
  role: "teacher",
  isAliased: true,
  originalUser: { id: "t", role: "teacher" },
});

describe("who counts as a teacher", () => {
  it("a teacher acts as a teacher", () => {
    expect(isActingAsTeacher(teacher)).toBe(true);
    expect(isTeacherAccount(teacher)).toBe(true);
  });

  it("a student is neither", () => {
    expect(isActingAsTeacher(student)).toBe(false);
    expect(isTeacherAccount(student)).toBe(false);
  });

  it("a teacher viewing as a student has no teacher powers, but can still switch back", () => {
    expect(isActingAsTeacher(teacherAsStudent)).toBe(false);
    expect(isTeacherAccount(teacherAsStudent)).toBe(true);
  });

  it("a teacher viewing as another teacher sees what that teacher sees", () => {
    expect(isActingAsTeacher(teacherAsTeacher)).toBe(true);
    expect(isTeacherAccount(teacherAsTeacher)).toBe(true);
  });

  it("nobody signed in is neither", () => {
    expect(isActingAsTeacher(null)).toBe(false);
    expect(isTeacherAccount(null)).toBe(false);
  });
});
