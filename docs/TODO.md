# TODO

Work that is understood and agreed but not done. Newest first.

---

## Decide what "view as user" means for teacher permissions

**Status:** needs a product decision, not a refactor. Nothing is broken or exploitable;
the app is answering the same question two different ways.

There are three ways to ask whether the current user is a teacher, and they disagree
whenever a teacher is aliased as a student:

| Check | Where | Reads | Aliased teacher |
|---|---|---|---|
| `hasTeacherPermissions(session)` | `app/utils/userUtils.ts` | `originalUser.role` | **true** |
| `isTeacher(session)` | `app/serverActions/groups/helpers.ts` | `session.user.role` | **false** |
| `session.user.role === "teacher"` | inline, 8 files | same as above | **false** |

Aliasing rewrites `session.user.role` to the aliased user's role and keeps the real one
in `originalUser` (`auth.ts:95-120`). So a teacher currently viewing as a student **can**
still fetch answer keys through `getGuideForTeacher` and see the teacher-only submission
errors, but **cannot** use `manageTeams`, `manageGroupProject` or `submitTeamEvaluation`
— those return NOT_AUTHORIZED.

Not a security hole: only teachers can alias, so nobody gains anything they did not
already have. But it is undecided rather than designed, and the names do not hint that
the two differ.

**The decision:** while aliased, does a teacher keep their powers (they are still a
teacher, just looking around) or lose them (they are pretending to be a student, so the
app should treat them like one)? Both are defensible. Whichever is chosen, the names
should make it visible — something like `isTeacherAccount()` versus
`isActingAsTeacher()` — and the eight inline checks should use them.

---

## Spread `requireSession` beyond the groups actions

**Status:** cosmetic. Worth doing while touching these files, not on its own.

`groups/helpers.ts` already has the auth wrapper, and 12 of 37 action files use it. The
other 25 hand-roll `await auth()`, a null check, and a bespoke failure message.

The reason it never spread is probably that the messages genuinely differ ("You must be
logged in to submit a return" versus "…to give a grade"), so the wrapper needs to take
the message. Same shape as the connection problem above: the solution exists, it is just
not reached for. Lower value, because forgetting it fails loudly and immediately rather
than silently in production.

---

## Make database connection automatic, like Prisma does

**Status:** designed, not started. Deliberately deferred — it changes the data path
for every query in the app, and it was raised during a run of production incidents.
Do it when nothing is on fire.

### The problem

Every server action that queries the database must call `connectToDatabase()` first.
Thirty-seven files do. Three shipped without it and broke in production only:
`submitExercise`, `returnGuide` and `updateUserInfo`. The bug cannot reproduce in
development, because rendering a page connects in the same process before any action
runs; on a serverless platform an action's request can land somewhere cold.

There is now an architecture test (`__tests__/architecture/serverActionsConnect.test.ts`)
that fails the build if an action forgets. That turns a silent outage into a red CI
run, which is a real improvement — but it enforces ceremony rather than removing it.

### Why it looks redundant (it is)

Mongoose does not connect on demand. `bufferCommands: true` (now enabled) makes a
query *wait* for a connection that is being established, but it does not *start* one.
So something has to call connect, and today that something is every caller.

### How Prisma avoids it

Prisma has no hand-written model files. One `schema.prisma` generates one
`PrismaClient`, and `prisma.user` / `prisma.guide` are properties of that single
object. The client connects lazily on first query. There is exactly one place the
connection concern *could* live, so there is nothing to remember and nothing to
import per model.

Mongoose spreads models over a dozen modules that each call `mongoose.model()`, so it
has no equivalent chokepoint of its own.

### The target design

Next provides the chokepoint mongoose lacks: **`instrumentation.ts`**, whose
`register()` runs once per server instance at startup, before any route module loads.
Register a global mongoose plugin there:

```ts
// instrumentation.ts (project root)
export async function register() {
  const mongoose = (await import("mongoose")).default;
  const { connectToDatabase } = await import("./app/serverActions/mongoose-connector");

  const ensureConnected = async () => { await connectToDatabase(); };

  mongoose.plugin((schema) => {
    schema.pre(/^find/, ensureConnected);
    schema.pre(
      ["save", "aggregate", "updateOne", "updateMany", "deleteOne", "deleteMany", "insertMany"],
      ensureConnected
    );
  });
}
```

Every query then self-connects, exactly like Prisma, and `connectToDatabase` returns in
microseconds when already connected. **No per-model import, and no per-action call.**

### Order of work

1. Add `instrumentation.ts` with the plugin. Land alone and verify.
2. Delete the 37 `connectToDatabase()` calls and their imports.
3. Delete `__tests__/architecture/serverActionsConnect.test.ts` — it enforces a rule
   that no longer exists.

Two commits at least, so a bisect can tell the mechanism from the cleanup.

### Verify before trusting it

- **Ordering is the risk.** `mongoose.plugin()` only applies to schemas compiled
  *after* it runs. If any model module is somehow imported before `register()`
  completes, that model silently has no hooks. Confirm empirically — do not assume the
  documented contract holds for every route type. A cheap belt: after registering,
  walk `mongoose.models` and attach the same hooks to anything already compiled.
- Confirm it applies in **both** dev and production builds.
- Confirm the tests still pass: the harness stubs `connectToDatabase` to a no-op
  (`__tests__/__mocks__/mongoHandler.ts`), so hooks calling it do nothing there, which
  is what we want.

### Known trade-off

The connection becomes **implicit**. A reader of `submitExercise` will not see why a
connection exists. Mitigate with a comment where the plugin is registered, and a
pointer to it from the connector.
