# Peer evaluation

How the group-project peer evaluation works, what changed on 2026-08-31, and
what is deliberately left for next year.

## What it is

After the presentations, every student rates **themselves and each teammate**
on two axes — contribution and teamwork — from −2 to +2, with a written
justification required for every score (`app/LMS/groups/[id]/components/EvaluateTab.tsx`).

**What the team writes is advice; what a teacher confirms is a grade.** The
scores students give never reach a grade by themselves — a teacher reads them
and confirms one contribution figure and one teamwork figure per student, and
those confirmed figures turn the team's project grade into that student's own
(the formula is below). A student with no confirmed figures gets no individual
grade at all.

An older scheme, which split the individual grade evenly between the peer and
the teacher evaluation, was described in the project documents but never
implemented. **It is not how anything works and is not coming back.** It has
been removed from the briefs in `scripts/seedGroupProjects.mjs` and from every
project-description document in `docs/`. Where a live project description in
the database still carries it, replace that text with the paragraph at the
bottom of this file.

## The balance rule

**Per evaluator, per axis, the scores across the whole team — the evaluator
included — must add up to zero or less.**

The scores are relative: each one says how that person did *compared with the
rest of the team*, which the score labels have always implied ("Less than
others", "Average", "More than others", "Most of the work"). A team therefore
cannot be rated above its own average. Marking somebody up is paid for by
marking somebody else down, and a team where everybody pulled their weight
equally is all zeros.

Rating the whole team *down* stays allowed. The asymmetry is deliberate: the
failure mode this rule exists for is inflation — "everyone was great, me most
of all" — which is what actually happened. It does leave one gap: "I was
average, everyone else was −2" balances and passes. That gap is why the teacher
confirms every result rather than reading a computed number (below).

Where it is enforced:

| Layer | What it does |
|---|---|
| `app/constants/groupWork.ts` | `validatePeerEvaluationSubmission` — the rule itself, imported by both sides so the wording is identical |
| `EvaluateTab.tsx` | live balance meter per axis, shown above the form and by the button; submit disabled while either axis is over |
| `submitPeerEvaluations.ts` | the actual enforcement — the form is a convenience, the action is the gate |

The action also requires that a submission covers **every** member of the team,
exactly once. Without that the balance rule means nothing: before this change
the action accepted any subset, so a single self-evaluation at +2 was a valid
submission, and duplicate rows could balance a total on paper while only one of
them reached the database.

## Evaluations made before the rule

Group 11's database contains at least one submission that breaks the rule. **It
is left exactly as it is** — no migration, no normalization, no writes of any
kind to that database. The rule applies to what is submitted from now on.

Instead the teacher report *flags* it: an evaluator whose scores add up to more
than zero gets an "unbalanced" marker on their row and a "pre-rule" marker on
every entry they wrote (`unbalancedEvaluators` in
`app/serverActions/groups/peerEvalShared.ts`). The numbers themselves are shown
raw. Normalizing them on display was considered and rejected — it would
silently change figures a teacher may already have read, and mix two rules in
one column.

A student whose saved answers break the rule sees a notice in the form saying
so; if they change anything, the new rule applies to the whole submission. That
is the only way old data gets corrected, and it happens by the student's own
hand.

## The teacher's confirmed result

Peer scores are advice, so somebody has to say what the advice comes to. On the
Evaluations tab each student's row carries:

- **Contribution** and **Teamwork** — the averages the team gave. Computed,
  never stored.
- **Confirmed** — the two figures the teacher accepted or replaced, on the same
  −2..+2 scale, defaulting to the averages. Both axes are kept separately
  because the grade formula multiplies them by each other.
- **Grade** — what those figures produce for this student, shown before release
  so nobody presses the button on a number they have not seen. The editor
  recalculates it live as the figures are typed.
- **Status** — Pending, Confirmed, Changed (the figures differ from what the
  team said), or Review (confirmed when fewer evaluations had arrived).
- A **note**, for the teachers only.

"Confirm N as the team scored them" accepts the computed value for everyone not
yet decided, which leaves the teacher with only the rows worth thinking about.
Stored in `peerEvaluationResults` (`app/models/peerEvaluationResult.ts`), one
row per student per project, written only by
`app/serverActions/groups/managePeerEvalResults.ts`.

**Students never see the raw material** — not the individual scores, not the
averages, not the note, not who said what, and not their team's grade. They see
the grade it produces for them, and only after a teacher releases the project's
grades
(`docs/feedback-visibility.md`). Handing the peer evaluation in opens something
earlier, though: their team's written feedback.

## How the individual grade is calculated

This is the source of truth for the calculation. It is deliberately identical
to the one Vefskólinn already runs in the SustainableIsland LMS
(`../SustainableIsland/API/Controllers/peerEvalController.js`), so the two
courses grade the same way.

```
project grade = mean of the team's rubric rows
                (each row blended by the project's own panel weighting)

P      = (contribution + 2) × (teamwork + 2) − 4        // −4 … +12
scale  = P >= 0 ? 0.025 : 0.175                         // +30% max, −70% max
factor = P × scale + 1

individual grade = min(10, project grade × factor)
```

Both figures are the **teacher-confirmed** ones, never the raw averages.

Three properties worth keeping in mind:

**The axes multiply, they do not average.** A student who carried the work but
was impossible to work with (+2 and −2) lands on P = −4 and keeps 30% of the
grade — the same as somebody who did nothing at all. Averaging the two axes
would have called them exactly average and changed nothing. This is the case
the formula exists to catch.

**It punishes harder than it rewards.** The best possible result is +30%, the
worst is −70%. That asymmetry is inherited from SustainableIsland and is
intentional: a group grade should not be a lottery you win by being liked.

**The clamp happens last, and only once.** Rubric rows are multiplied uncapped
and the mean is capped at 10. Capping each row first would take the boost away
from a team that scored 10 on one row and middling on the rest — the student
would lose the credit above 10 on the perfect row and keep the shortfall on
every other one. `clampGrade` in `app/constants/groupWork.ts`, with a test that
fails if the order is ever swapped.

A student's row on the rubric can therefore read above 10 while their grade
reads 10. That is the arithmetic being honest about itself, not a bug.

### What feeds the project grade

Two things about the team's own score are set per project, and both can be
changed afterwards — with a warning when the grades are already out, because
both move published grades.

**The panel share** (`panelWeight`, default 0.8). Teachers and invited judges
carry that share of every row; the student audience carries the rest. Module 1
runs at **100/0**: two weeks into the course students do not feel ready to put
a number on each other's work, so their scoring is practice and written
feedback, not part of the grade. By the later modules they are comfortable
owning a fifth of it, which is what the project documents describe. At 100/0 a
row only the audience scored has no score at all, rather than quietly becoming
the team's grade.

**Each judge's focus.** A judge asked to judge only design counts on the design
and general rows; their coding scores are kept but not counted. Judges often
decide this at the presentation itself, so teachers can re-scope them
afterwards from the judges panel (`updateJudgeFocus`, teacher-only — a judge
holds a token, not a session, and must never be able to change what their own
scores count towards). It is reversible: widening a judge back to Everything
brings their stored scores straight back into the averages. That matches the rest of the app, where a student sees their team's
rubric feedback once the project is archived and nothing else. If it should
ever be shown, show the confirmed value only, never the individual scores or
who gave them.

## Still to do

Tracked in `docs/TODO.md`: decide, at the start of the next cohort, what to do
with the pre-rule rows — leave them flagged forever, or normalize them once the
cohort they belong to is finished.

---

## Paste-ready text for students

For the five project descriptions in `docs/*.docx` and for each project's
**description** field (teacher Settings tab — the seed script is a record, it
is never run):

> After the presentation each student fills out the peer evaluation, rating
> themselves and every teammate on contribution and teamwork. The scores are
> **relative**: each one says how that person did compared with the rest of the
> team, so they have to add up to zero or less — marking somebody up means
> marking somebody else down, and a team cannot be rated above its own average.
> If everyone pulled their weight equally, everyone is Average.
>
> No score you give becomes anybody's grade by itself. Your teachers read all
> of it and confirm one contribution figure and one teamwork figure for each
> student. Those confirmed figures adjust the team's project grade into each
> person's own grade: an average team member keeps the project grade, and from
> there the adjustment runs up to +30% and down to −70%. Once you have handed
> in your own evaluations you can read the written feedback your team received
> — you do not have to wait for the rest of the class — and your grade appears
> when your teachers release it.
