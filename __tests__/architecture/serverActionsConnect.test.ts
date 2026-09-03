/**
 * @jest-environment node
 *
 * Every server action that queries the database must connect first.
 *
 * This is a production-only failure and it is invisible in development: a page
 * render connects in the same process, so by the time an action runs the
 * connection already exists. On a serverless platform the action's request can
 * land on an instance where nothing has connected, and mongoose either buffers
 * until it times out ("Operation `guides.findOne()` buffering timed out after
 * 10000ms") or throws outright. submitExercise, returnGuide and updateUserInfo
 * all shipped with this bug.
 *
 * Helper modules are exempt: they are only reachable through an action, and the
 * action is what has to connect.
 */
import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "app");

const MODEL_NAMES = [
  "Guide",
  "User",
  "Return",
  "Review",
  "ExerciseAttempt",
  "Team",
  "GroupProject",
  "GroupPreference",
  "PeerEvaluation",
  "TeamEvaluation",
  "JudgeInvitation",
  "RateLimit",
  "CalendarEvent",
  "Semester",
];

const QUERY_METHODS = [
  "find",
  "findOne",
  "findById",
  "findByIdAndUpdate",
  "findOneAndUpdate",
  "create",
  "insertMany",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "countDocuments",
  "aggregate",
  "bulkWrite",
  "distinct",
];

const QUERY_PATTERN = new RegExp(
  `\\b(${MODEL_NAMES.join("|")})\\.(${QUERY_METHODS.join("|")})\\s*\\(`
);

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });

/** A file is an entry point when the runtime can call into it directly. */
const isServerEntryPoint = (source: string): boolean =>
  /^\s*["']use server["']/m.test(source.split("\n").slice(0, 5).join("\n"));

describe("server actions connect to the database", () => {
  const offenders: string[] = [];

  for (const file of walk(APP_DIR)) {
    const source = fs.readFileSync(file, "utf-8");
    if (!isServerEntryPoint(source)) continue;
    if (!QUERY_PATTERN.test(source)) continue;
    if (source.includes("connectToDatabase")) continue;
    offenders.push(path.relative(process.cwd(), file));
  }

  it("every 'use server' file that queries a model calls connectToDatabase", () => {
    expect(offenders).toEqual([]);
  });

  it("actually inspects files, so a broken matcher cannot pass silently", () => {
    const entryPoints = walk(APP_DIR).filter((f) =>
      isServerEntryPoint(fs.readFileSync(f, "utf-8"))
    );
    expect(entryPoints.length).toBeGreaterThan(5);

    const querying = entryPoints.filter((f) =>
      QUERY_PATTERN.test(fs.readFileSync(f, "utf-8"))
    );
    expect(querying.length).toBeGreaterThan(3);
  });
});
