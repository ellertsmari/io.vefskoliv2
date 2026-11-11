# TODO

Work that is understood and agreed but not done. Newest first.

---

## Next cohort: decide what happens to pre-rule peer evaluations

**Status:** deliberately deferred to the start of the next school year. Nothing is broken;
the decision is only worth making once Group 11 is finished with these projects.

Peer evaluation scores now have to add up to zero or less per axis
(`docs/peer-evaluation.md`). The rule is enforced on submission only. Group 11's database
contains at least one submission made before it existed, where the evaluator rated
themselves and everybody else above average, and **that data was left untouched on
purpose** — no migration was run against a live cohort's database mid-course.

Today those rows are flagged in the teacher report ("unbalanced" on the giver's row,
"pre-rule" on each entry they wrote) and counted raw in the averages. The teacher's
confirmed result is the backstop: it is set by hand and never derived automatically.

**The decision, once the cohort is done:** leave the flags in place forever, or normalize
the old rows once (subtract each evaluator's mean per axis) so the historical averages are
comparable with everything after them. Normalizing rewrites what students actually said,
so it is only defensible on data nobody is being graded from any more.

Whatever is chosen, the flag should stay in the report — it costs nothing and it is the
only thing that distinguishes advice given under one rule from advice given under another.

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
