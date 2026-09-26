# Exercise engine — one continuous attempt

Design record for replacing finished, numbered attempts with a single attempt per
student per guide that never closes. Decided with Smári on 2026-09-26.

## Why

The first real quiz guide (TypeScript Introduction) exposed three problems with the
attempt model:

1. **Finish looked like save.** Students stopping in class to carry on at home pressed
   Finish, which scored and closed the attempt with most of it unanswered.
2. **Trying again meant redoing everything.** A new attempt redraws only the quiz. On the
   live guide that is 11 of 87 points; the other 76 — 16 coding tasks and 20 short
   answers — are the same tasks, done again from scratch. A student at 66% had to repeat
   all of it to get 11 new quiz questions.
3. **Nothing said what passing took.** The 70% pass mark appeared nowhere a student
   could see it, and "not passed" beside 6.4/10 looks like a bug to anyone used to 5.

## Decisions

**1. One attempt, open for good.** No Finish, no attempt numbers. The student works
through the exercise at their own pace, on any computer, and the grade is live.

**2. The guide passes the moment the score reaches the pass mark.** Before that it is
*in progress* with its current grade, never *failed* — nothing is final.

**3. Multiple choice: one guess per question.** A wrong guess locks the question and
reveals the answer with its explanation. The way forward is a **new question** from
the pool, worth half of what the locked one was. Wrong again, and the next is worth a
quarter, and so on. The button says what the next question is worth
("New question — worth ½ point"), so the rule explains itself.

- Locking rules out guessing by elimination: every guess is a first guess on a
  question the student has not seen the answer to.
- The replacement comes from the **same learning goal** when one is left, so the slot
  keeps covering the same topic; otherwise any unseen question.
- A question whose answer was revealed is never served to that student again.
- *Judgement call, not asked:* when the whole pool is used up, the button is disabled
  ("No new questions left") and the slot stays locked.

**4. Short answers: same halving, same question.** They are not pooled, so there is
nothing to swap in. Each wrong try halves what the next is worth. An answer held for
teacher review (`pending`) is not a wrong try — it may yet be accepted.

**5. Code: unchanged.** Scored on the code the student ends up with; re-running costs
nothing. Iterating is how code gets written.

**6. Existing attempts are merged, with a one-time amnesty.** Everything a student got
right in *any* earlier attempt counts at full points — including answers that were right
only on a later try, which scored 0 under the old first-try rule. Everything else is open
to do again at full value. Nobody's grade goes down: a first-try answer is worth 1 under
both rules, and the merge takes the best result per task across attempts.

The merge runs in code the first time a student's guides are loaded after the change —
no migration script, nothing to import in Compass. The old attempt documents are kept,
marked `merged`, so the history is not lost.

## Model

The attempt stores what the student did; the score is always **derived** from that and
the *current* answer key, and only cached on the document for listing. A teacher
promoting a short-answer phrasing therefore re-grades every student who wrote it,
at whatever try they wrote it.

- `slots` — the quiz, one slot per served question. Each slot is the list of questions it
  has held, with the answer given to each. The base value of a slot is its first
  question's points; it earns `base × ½^(wrong answers before the right one)`.
- `served` — the short-answer and code tasks this student works on.
- `tries` — every answer given to each short-answer task, in order.
- `answers`, `codeResults` — the latest answer per task, and what each code task's latest
  run did.
