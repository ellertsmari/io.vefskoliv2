# Merging `refactor/feature-boundaries`

This branch moves files. Git handles that better than you would expect, but
there is one case where it reports success and leaves you with a broken build.
This page is what to check.

## The plan: rebase onto main once the other work lands

```sh
git checkout main && git pull
git checkout refactor/feature-boundaries
git rebase main
find app/LMS/components -type f 2>/dev/null   # must print nothing — see below
npm run verify
git push -u origin refactor/feature-boundaries
```

Rebasing this direction is deliberate: the moves replay *last*, on top of
whatever landed on main. Everything below was tested both ways (merging this
branch in, and rebasing it onto main) and behaves identically.

## What moved

| Before | After |
|---|---|
| `app/LMS/components/feedback/**` | `app/guides/components/feedback/**` |
| `app/LMS/components/grading/**` | `app/guides/components/grading/**` |
| `EventCategory` / `CalendarEvent` / `CategoryMeta` in `app/LMS/calendar/calendarData.ts` | `types/calendarTypes.ts` |

`app/LMS/components/` no longer exists. `calendarData.ts` re-exports the three
types it used to define, so `import { ... } from "./calendarData"` still works.

Also deleted, from **both** `tsconfig.json` and `jest.config.ts`: the `@/*`,
`hooks/*`, `pages/*` and `clientActions/*` aliases (all pointed at directories
that do not exist) and `components/*` (unused).

## The three cases that merge cleanly on their own

These were tested against a simulated branch, not assumed:

1. **They edited a file we moved.** Git detects the rename and replays the edit
   at the new path. Nothing to do.
2. **They rewrote a file we moved**, past the point where rename detection
   normally gives up. Still clean — our side moved the file without changing its
   contents, so the rename is unambiguous.
3. **Relative imports inside the moved files.** `feedback/` and `grading/` moved
   *together*, so `../../grading/grade/Grade` still resolves. This is why both
   folders moved at once rather than one at a time.

## The case that bites: a new file in a deleted folder

If they **added a new file** under `app/LMS/components/feedback/` or
`app/LMS/components/grading/`, git merges with **no conflict and no warning**.
The new file stays at the old path, resurrecting the folder we deleted, while
everything around it has moved to `app/guides/components/`. Any relative import
between the two now points into an empty tree, and `next build` fails.

Git cannot help here: it has no way to know a file added to a directory was
meant to follow that directory somewhere else.

**`npm test` now catches this** — `featureBoundaries.test.ts` fails with
"Files reappeared in a directory that was moved away" and names the files. To
check by hand before running the suite:

```sh
# Should print nothing. If it prints anything, that file needs to move.
find app/LMS/components -type f 2>/dev/null
```

**Fix:**

```sh
git mv app/LMS/components/feedback/<theirNewThing> app/guides/components/feedback/
rmdir -p app/LMS/components/feedback 2>/dev/null
# then fix its imports and any imports pointing at it
npx tsc --noEmit
```

## `tsconfig.json` / `jest.config.ts` will conflict if they touched aliases

Both sides edit the same small block, so git gives up and asks. The conflict
looks like this:

```
<<<<<<< HEAD
      "@/*": [ "./src/*" ],
      "components/*": [ "app/LMS/components/*" ],
      "lib/*": [ "./app/lib/*" ],          <-- theirs, keep this one
=======
>>>>>>> refactor/feature-boundaries
```

**Do not resolve this by keeping HEAD.** That restores all the dead aliases.
Keep only the alias they actually added, drop the rest. Then make the same edit
in `jest.config.ts` — the two files had already drifted apart, which is part of
what this branch fixes.

## After any merge, run the gate

```sh
npm run verify     # build, typecheck, 457 tests, verify:trace
```

Two failures are specific to this branch and worth recognising:

- **`featureBoundaries` fails with "A feature is importing another feature's
  internals".** Their new code imports across a feature boundary. The fix is
  usually to move the shared thing down into a shared layer
  (`types/`, `utils/`, `constants/`, `models/`, `UIcomponents/`,
  `globalStyles/`), not to add an entry to `KNOWN_VIOLATIONS`. That list is
  existing debt and should only shrink. If the importer is a `page.tsx` or
  `layout.tsx` it is already exempt, so a failure there means the import is
  somewhere else.

- **`known violations are actually still there` fails.** Someone fixed a listed
  violation. Delete that line from `KNOWN_VIOLATIONS`. This is a good failure.

## If it goes badly

```sh
git rebase --abort     # or: git merge --abort
```

Nothing is lost. Re-run and resolve again, or merge instead of rebasing — the
outcomes were identical in testing, so pick whichever conflict presentation you
find easier to read.
