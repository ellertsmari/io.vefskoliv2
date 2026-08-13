# Writing exercise questions

The standard for questions in an auto-graded guide. **Read this before writing any**, and
run `python3 scripts/checkExerciseBank.py` after.

It exists so the quality bar lives in the repo rather than in whoever remembers to ask for
it. Everything here is something that would otherwise have to be requested after the fact.

---

## 1. Research the misconceptions before writing the options

**This is the step that gets skipped.** A question is only as good as its wrong answers, and
a wrong answer is only worth reading if a real student might genuinely believe it.

For each topic, find out what learners actually get wrong — not what is merely false. The
difference:

| Distractor | Verdict |
|---|---|
| `typeof []` is `"array"` | **Good.** Almost everyone assumes this. It is wrong for an interesting reason. |
| `typeof []` is `"list"` | **Weak.** No one believes it; JavaScript has no `list`. It is filler. |
| `"0"` is falsy | **Good.** The string/number confusion is one of the most common beginner bugs. |
| `[]` is falsy | **Good.** Surprises nearly everyone, including experienced developers. |

Where to look: MDN's own "common mistakes" notes, the questions students actually ask in
class, Stack Overflow's most-upvoted questions on the topic, and the errors visible in past
student returns.

**Record what you found.** Each wrong option's note must name the misconception it encodes,
in terms of the option the student picked. A note that could be pasted onto any option of any
question has not done the work.

## 2. Ask something worth asking

- **Assess understanding, not recall of wording.** If the answer can be found by string
  matching the guide text, it tests reading, not learning.
- **One idea per question.** If a student can get it wrong for two unrelated reasons, you
  cannot tell which one they hold.
- **No trick questions.** A student who understands the topic should get it right. Difficulty
  should come from the idea, never from the phrasing.
- **Avoid negatives** ("which of these is NOT…"). They test careful reading under time
  pressure, which is not the subject.
- **No "all of the above" or "none of the above".** They reward exam technique.
- **Every option must be plausible in length and shape.** The longest option being correct is
  a real and well-known pattern; do not create it.

## 3. Cover the ground deliberately

- Every `knowledge` item on the guide should have **at least three** questions tagged to it,
  so a pooled draw cannot leave a goal unassessed.
- Mix what the questions demand: some recall (*which keyword…*), some application (*what is
  the value of…*), some diagnosis (*why does this not work…*). A bank of pure recall makes
  a student who memorised the guide indistinguishable from one who understood it.
- Short-answer questions want a **single unambiguous answer** — a keyword or a term. If a
  reasonable student could phrase it five ways, make it a quiz question instead.

  The test: **cover the accepted answers and answer your own question.** If you cannot,
  neither can a student. One shipped reading *"TypeScript says a property does not exist on
  type. What is the first thing to check?"* — the intended answer was "spelling", and the
  teacher who wrote the material tried the type, the interface, the union and the object
  before giving up. Every one of those was a reasonable thing to check first. A marker that
  compares strings cannot grade a judgement; ask for the term, or make it multiple choice
  where the reasoning is visible in the options. Write
  `answerFeedback` for the wrong answers you can predict, especially the mirror-image ones:
  `==` for `===`, "arguments" for "parameters", `for...in` for `for...of`. Those are the
  cases where a student is closest to understanding and a specific explanation lands hardest.
- Code tasks want a problem with **one obvious shape and several valid solutions**, so the
  structural check can require iteration without dictating a `for` loop.

## 4. Do not repeat yourself

With a bank this size it is easy to write the same question twice in different words. The
checker flags near-identical prompts, but it only catches wording — two questions can test
exactly the same thing while reading differently. Before adding one, ask what it assesses
that nothing else in the bank does.

## 5. The mechanics

- Every task needs its own `_id`. Nothing generates them: the collection is imported as raw
  JSON, and without ids every task shares `""`, which silently breaks answer keying, pooling
  and grading.
- Every wrong option needs a note. **No correct option may have one** — a note on a correct
  option tells the student which one it is.
- A short answer's `answerFeedback` must never `match` something in `acceptedAnswers`. The
  checker fails on it: a student who gets the question right would be told why they are wrong.
- Every question needs `helpLinks` pointing at material that actually answers it, and every
  link must return 200.
- Code tasks need at least one hidden test, a reference solution that passes every case, and
  starter code that does not.

---

## 6. Designing code tasks

Beginners do not get better at programming mainly by writing more programs from a blank
page. A few things are well established about how they do improve, and each one suggests a
kind of task:

- **Cognitive load is the limiting factor.** A task that introduces two unfamiliar ideas at
  once mostly measures which one they had already met. Add one idea at a time — which is why
  the tasks here start at `helloWorld` and reach `summarise` sixteen steps later, and why a
  student meets a parameter, a return value and an arrow function separately before meeting
  a problem that needs all three.

- **Completion beats blank pages.** Finishing partly-written code costs less working memory
  than producing it from nothing, and transfers about as well. Every task ships starter code
  with the signature and the shape already there; the student supplies the idea.

- **Reading and repairing is a separate skill from writing**, and one students are rarely
  asked to practise even though they will spend more career hours doing it. `averageOf` is
  given already written and already broken, with two of the most common bugs in it: a loop
  that starts at 1, and an empty input that divides by zero. The instruction is explicitly
  *do not rewrite it from scratch*.

- **Transfer needs the surface to change.** A student who can total a list of numbers has
  not necessarily learned the accumulator plan — they may have learned that shape of code.
  `longestWord` is the same plan as `largest` with strings and a different comparison, so it
  only works if the plan was understood rather than copied.

- **Combining two known plans is its own difficulty.** `runningTotals` needs a running total
  *and* an array being built, in one pass. Each half is already familiar; holding both at
  once is the step, and it is reliably harder than either alone.

- **Edge cases are where understanding shows.** Empty input, one item, a tie, the answer
  being first rather than last. Put at least one of these in the hidden test, because the
  visible cases teach the shape and the hidden one asks whether it generalises.

What to avoid: puzzles that reward a trick rather than the concept, problems whose hard part
is understanding the wording, and anything where the naive solution passes every visible test
and fails only on something arbitrary.

---

## Before you say it is done

Run the checker:

```
python3 scripts/checkExerciseBank.py                 # structure, notes, duplicates, coverage
python3 scripts/checkExerciseBank.py --check-links   # also verifies every link returns 200
npx jest __tests__/content/exerciseBank.test.ts      # runs the code tasks for real
```

The checker enforces §5 and flags §4. **It cannot judge §1, §2 or §3** — it can only tell
that a note exists, not that it names a real misconception. Those are read by a person, and
the notes are what make that possible.
