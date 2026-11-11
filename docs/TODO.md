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

## Spread `requireSession` beyond the groups actions

**Status:** cosmetic. Worth doing while touching these files, not on its own.

`groups/helpers.ts` already has the auth wrapper, and 12 of 37 action files use it. The
other 25 hand-roll `await auth()`, a null check, and a bespoke failure message.

The reason it never spread is probably that the messages genuinely differ ("You must be
logged in to submit a return" versus "…to give a grade"), so the wrapper needs to take
the message. Same shape as the connection problem above: the solution exists, it is just
not reached for. Lower value, because forgetting it fails loudly and immediately rather
than silently in production.
