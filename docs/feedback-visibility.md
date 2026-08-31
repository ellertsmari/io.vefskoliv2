# What students see of their feedback, and when

Written on 2026-08-31, alongside the peer-evaluation balance rule
(`docs/peer-evaluation.md`).

## Two reveals, not one

Feedback used to appear in one lump when a project was archived. It now arrives
in two stages, for two different reasons.

| | When | What appears | Who decides |
|---|---|---|---|
| **Written feedback** | The moment *that student* has handed in their own evaluations | Every comment their team received | The student, by finishing |
| **Grades** | When a teacher completes the project, and only for students whose peer figures they have confirmed | Their own grade, and what each rubric row came to for them. Never the team's grade | The teachers |

The first is a reward for finishing: a student who has handed in does not wait
for the classmate who hasn't. The second is a decision teachers were already
making informally and now make explicitly.

A released student without confirmed peer figures sees a line saying their
grade is not final yet — never a grade computed from a default, and never the
team's numbers as a stand-in. The calculation itself is documented in
`docs/peer-evaluation.md`; it is the SustainableIsland formula, unchanged.

### The group grade is not a student's to see

A student is shown their own grade and their own per-row figures, and nothing
else. The team's project grade and the factor applied to it stay on the server
— `getGroupProject` computes the team average to derive the grade and then
drops it. Both are withheld together on purpose: since
`grade = projectGrade × factor`, publishing either one hands over the other by
division, so the student payload (`StudentGrade`) carries neither, and a test
asserts that neither number appears anywhere in it.

This holds up against arithmetic, too. A student is never shown their own
confirmed figures either, so a student whose factor happens to be exactly 1 has
no way to know that the numbers in front of them are the team's. Two teammates
comparing grades recover only the *ratio* between their factors, never either
factor by itself, so nothing divides out to the project grade — the formula
being public does not help, because it leaves two unknowns per student and they
only ever see the product.

A whole team pooling their numbers can estimate the neighbourhood, not the
figure: the balance rule keeps each evaluator's scores summing to zero or less
and every member is scored exactly once by everyone, so the team's confirmed
figures average out at zero or below and their individual grades generally sit
at or a little under the project grade.

"Handed in" means everything that is actually open to them: every other team
scored (when team evaluation is open and there are other teams — Module 5's
single team is exempt by construction) and their peer evaluation submitted
(when that gate is open). Computed per student, server-side, in
`getGroupProject`: what a student has not earned is not in the payload.

Marking a project **Completed** still opens the written feedback to everybody
on a team, including whoever never handed in. Nothing a student can see today
is taken away, and the incentive still works, because the reward is seeing it
*earlier*, not exclusively.

## Completing and publishing are one action

"Complete project & publish grades" is a single button, and it closes team
evaluation at the same moment. The three go together for one reason: **a grade
that can still move is worse than a grade that has not arrived yet.** While
team evaluation is open, one late score changes a team's project grade, which
changes every published individual grade in that team — students would watch
their own grade drift for no reason they can see.

Peer evaluation stays open. A late peer evaluation changes only the advisory
averages, never a confirmed figure, so it cannot move a published grade on its
own — and it still lets a latecomer hand in. Written feedback never waited for
any of this: pedagogically it is the part that matters most and the part that
should arrive while the presentation is still fresh, so it opens for each
student the day they hand in. The grades can wait until everything is in and
the teachers have decided.

Reopening a project un-publishes the grades and makes the hubs editable again;
turning team evaluation back on stays a separate, deliberate switch.

## "Archived" is now "Completed"

The stored status value is still `"archived"` — it is the enum on every project
document ever written, and renaming the value means a migration against a live
cohort's database. Only the label changed
(`PROJECT_STATUS_LABELS` in `app/constants/groupWork.ts`), along with every
user-facing string that said "archive".

The name mattered because the state no longer means "shut": **completing a
project does not close the evaluation gates.** Latecomers still hand in, and
everyone else has already had their feedback for days. What completing does do
is make team hubs read-only and open the feedback to everyone.

## Who gets named

In the student's view of their own team's feedback:

- **Teachers and invited judges are named.** They came to judge; standing
  behind it is part of that.
- **Classmates never are.** Every student evaluator arrives as
  `evaluatorKind: "student"` with `evaluatorName: null`. The name is absent
  from the payload, not hidden in the UI, and all of their comments are
  gathered under one heading, "The other students".
- **No individual scores at all.** A number attached to one evaluator invites a
  hunt for who gave it, which is the same problem as a name. Students get their
  team's averages instead, and only after release.

Teachers keep full names and full scores on the Evaluations tab. That has not
changed.

## Published quotes on the showcase

A team may publish up to `MAX_SHOWCASE_QUOTES` (6) of the comments it received
on its public showcase page. The choice is the team's — stored as
`Team.showcaseQuotes`, a list of `TeamEvaluation` ids — while the evaluation
itself stays the evaluator's. `setShowcaseQuotes` checks every id against that
team's own feedback, so nothing can be published by guessing an id, and it
keeps working on completed projects: the showcase page outlives the course by
years, and curating it is what happens afterwards.

Attribution carries only as much identity as the writer agreed to:

| Writer | Published as |
|---|---|
| Teacher | `Anna Signý, teacher` |
| Judge who opted in | `Guðmundur Ólafsson, industry judge` |
| Judge who did not | `An industry judge` |
| Student | `Another student` |

**Scores are never published**, whoever wrote them.

The judge's opt-in lives on their own judging page (`/judge/<token>`), set by
them and nobody else — the same principle as the students' showcase name
consent — and it says plainly why it is being asked: a named professional makes
the showcase more trustworthy to the people who read it. It defaults to off, is
reversible at any time, and teachers can see who agreed from the judges panel.

## Where this lives

| Concern | File |
|---|---|
| Unlock rule, feedback payload, grades | `app/serverActions/groups/getGroupProject.ts` |
| The grade arithmetic | `peerGradeFactor` / `projectGradeFromScores` / `clampGrade` in `app/constants/groupWork.ts` |
| Completing + publishing, grade weighting | `app/LMS/groups/[id]/components/ProjectSettings.tsx` |
| Judge focus, re-scoped after the fact | `updateJudgeFocus` + `JudgesPanel.tsx` |
| Locked card, grouped feedback, quote picker | `app/LMS/groups/[id]/components/TeamHubTab.tsx` |
| Quote choice | `app/serverActions/groups/setShowcaseQuotes.ts` |
| Judge consent | `setJudgeShowcaseConsent` in `app/serverActions/groups/judgeActions.ts` |
| Public attribution | `attributionFor` in `app/serverActions/groups/getShowcase.ts` |
