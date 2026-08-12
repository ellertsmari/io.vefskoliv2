# Exercise engine — short-answer and code tasks

Design record for extending the auto-graded exercise engine beyond multiple choice.
Decided with Smári on 2026-08-12, question by question.

## Why

The engine ships one task type: `quiz`, multiple choice (`ExerciseTaskType.QUIZ`).
That was fine for Phase 1, but it blocks the thing it was built for. The plan to merge
Module 3's four TypeScript Introduction guides into one auto-graded guide stalled on it:
each of those guides carries a **skill** objective phrased as doing, not knowing —

| Guide | Skill objective |
|---|---|
| Data types | "Be able to use variables and other basic constructs" |
| Conditionals | "Be able to execute conditional statements" |
| Loops & Iterators | "Be able to use loops and iterators to create lists" |
| Functions | "Be able to use functions" |

A multiple-choice question can evidence the `knowledge` objectives and not one of these.
Merging the guides onto a quiz-only engine would have meant rewriting four skill
objectives into knowledge objectives to match what the tool could measure — letting the
engine set the curriculum. Hence: engine first, guides after.

## The blocking assumption

An answer is a list of option indices, and that is asserted in five places:

- `ExerciseAnswers = Record<string, number[]>` — `app/utils/exerciseUtils.ts`
- `z.record(z.string(), z.array(z.number().int().min(0)))` — `app/serverActions/submitExercise.ts`
- `type Answers = Record<string, number[]>` — `app/guides/components/exercise/ExerciseView.tsx`
- `options` and `correctAnswers` required on `exerciseTaskSchema` — `app/models/guide.ts`
- `QuizTaskPublic` is `ExerciseTaskPublic` outright — `types/guideTypes.ts`

Short-answer and code both submit a string. Everything else follows from that one change.

`app/models/exerciseAttempt.ts` needs nothing — `answers` is already `Mixed`.

## Decisions

**1. Short-answer matching.** A list of accepted answers, compared after normalising case,
surrounding whitespace and trailing punctuation. A teacher may write a regex instead when
the answer has real variation. Simple default, escape hatch for the awkward cases.

**2. Unmatched answers.** Three states, not two: `correct` / `wrong` / `pending`. An answer
within a small edit distance of an accepted one is held as **pending review** rather than
marked wrong, and waits for a teacher. Teachers see unmatched answers in analytics and can
promote any into the accepted list, which retroactively re-grades everyone who wrote it —
`computeExerciseAnalytics` already recomputes against the *current* key rather than storing
verdicts, so this costs nothing extra.

*Judgement call, not asked:* a pending task counts as **not yet earned**, so the score a
student sees is a floor that can only rise, and a pending attempt reads as "awaiting review"
rather than failed.

**3. Code grading.** Run the submission against teacher-written test cases in a sandbox,
**plus** a structural check that the student used the construct the guide teaches. Hidden
tests alone stop hardcoded output; the structural check is what makes "this guide is about
loops" assessable.

**4. TypeScript.** Type-check the submission with the real compiler, then strip types and run
the JavaScript. Type errors become student feedback. The guides say *"Remember to add types
to every variable you declare"* and nothing but a human reviewer currently checks it — losing
that to auto-grading would have been a regression.

**5. Test visibility.** Most test cases visible, one or two hidden. Visible ones give a
first-time programmer something concrete to debug; hidden ones check the solution generalises.

**6. Scoring.** Partial credit per passing test, matching the existing multi-select
philosophy ("a student who finds 3 of 4 right answers is not in the same place as one who
found none"). The structural check is worth its own slice of the points — roughly a fifth —
never a gate. A student who solves a loop exercise with `.reduce()` loses that slice and
keeps a strong score, rather than being zeroed for writing better code.

**7. Errors.** Plain-language cause, then the real error text, then the line **as the student
wrote it** — which means mapping positions back through the type-strip and the test wrapper.
Every failure becomes practice at reading a real error, which the curriculum teaches nowhere.

**8. Mixing and pools.** One exercise may hold all three types, with a pool size **per type**:
"6 of 14 quiz questions, 1 of 3 short answers, 2 of 5 code tasks". Same shape of assessment
for everyone, different problems each — the anti-copying property the randomised Mockaroo
data was reaching for, without a shared API key. Replaces the single global `poolSize`.

**9. Authoring.** No teacher UI for now. Code tasks are authored by hand into the guide
documents. **Consequence:** `ExerciseEditor` currently types its state as `QuizTaskForm[]`,
rebuilds `tasks` wholesale on every keystroke and renders `task.options.map(...)`
unconditionally — a hand-authored code task would throw on render and be mangled on save.
Phase 0 must make the editor pass unknown task types through untouched.

**Scope note.** Smári is the only teacher using the system, and these code tasks are specific
to the Module 3 TypeScript guides — they are not meant to be reused elsewhere. So the
structural check implements exactly what Module 3 teaches rather than a general vocabulary,
and no authoring UI is built. The one teacher-facing surface still required is a minimal way
to resolve a `pending` short answer (decision 2), or held answers never clear.

## Sandbox

**QuickJS compiled to WebAssembly** (`quickjs-emscripten`). io.vefskoli.is runs on Vercel,
which rules out native modules (`isolated-vm`) and cannot hard-kill worker threads; Node's
`vm` is not a security boundary. A WASM interpreter gives real isolation with enforceable
time and memory caps and no filesystem or network access at all.

## Phases

**Phase 0 — the union refactor.** Turn the quiz task into one member of a discriminated
union; grading dispatches on `type`. No new capability, no database change, existing tests
stay green. Carries almost all the risk to what already works, so it lands and is verified
alone. Includes the `ExerciseEditor` pass-through fix.

**Phase 1 — short answer.** Decisions 1 and 2. No sandbox.

**Phase 2 — code.** Decisions 3–7. The sandbox, the TypeScript pipeline, the structural check.

**Phase 3 — the guides.** Return to merging the four TypeScript Introduction guides, now
against an engine that can assess their skill objectives. See `docs/guide-fixes-2026-08.md`.

## Applying any of this to a database

Through Compass, by hand. No script is run against any database — see the same note in
`docs/guide-fixes-2026-08.md`.
