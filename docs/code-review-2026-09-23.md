# Code review, cleanup and prompt audit — September 2026

Three reviews done on 2026-09-22/23: the `feature/reverse-flash` branch, the whole codebase
(unused code and simplification), and the prompt/instruction files. The cleanup they led to
was merged to `main` from `chore/cleanup`.

## 1. `feature/reverse-flash` (LiveKit live classroom)

No high-severity issues. Checked and correct: teacher-only start/end in the API route, a
stale tab cannot end a newer session, per-role publish permissions, and the camera/microphone
`Permissions-Policy` scoped to `/LMS/live`.

Two low-severity bugs, both in `app/LMS/live/useClassroom.ts`, **not yet fixed** (they live on
that branch):

1. **~line 185** — when the connection drops while lobby tracks are being published, the
   `track.stop(); continue;` branch skips `preview.current[kind] = null`. The ref keeps a
   stopped track, so the next "Turn on camera" click takes the "turn off" branch and does
   nothing; a second click is needed. Fix: null the ref before `continue`.
2. **~lines 45–47** — `refresh()` sets `error` on a failed status poll but never clears it on
   a later success. One brief 503 leaves "The classroom connection is unavailable…" on screen
   for the rest of the session, and it overwrites device/join errors. Fix: clear the error on
   a successful poll, only if the poll set it.

## 2. Whole codebase — unused code and simplification

Found with `knip`, then checked by hand. Done in `chore/cleanup`:

| Commit | What |
|---|---|
| `4af807c` | Deleted `getExerciseAttempts.ts` (superseded by `getExerciseSummary` in `3181ce4`), `guideCategories.ts` (superseded by `utils/guideTaxonomy`), two applied one-off migration scripts, and 10 point-in-time files in `documentation/` including a tracked `CLAUDE.md`. |
| `e98a59a` | `safeSerialize` replaced with a plain JSON round trip. The old version turned the second reference to any shared object into the string `"[Circular Reference]"`; its ObjectId/Date branches never ran. Covered by `__tests__/utils/serialization.test.ts`. |
| `dfb7c12` | `yarn.lock` resynced — it had drifted ~470 lines from `package.json` on `main`. |
| `271fcc7` | Removed `framer-motion`, `quickjs-emscripten`, `babel-jest` (all unused). Declared `mongodb` (`~6.20.0`, mongoose's version) — it was imported in 27 files but only present transitively. |
| `d9e4a33` | Removed dead code: 12 styled components, unused re-exports, `useSessionState`, `isCodeGuide`/`isDesignGuide`/`DISCIPLINES`, `MAX_TEAM_IMAGES`, and `countExerciseTasks` (an exported server action nothing called, so only a public endpoint). Helpers used only in their own file are no longer exported. |

Verified with the CI steps: build, `tsc`, jest (76 suites; the first run hit the known
mongodb-memory-server timeout, the re-run passed), `verifyBuildTrace`.

Deliberately kept:

- `package-lock.json` **and** `yarn.lock` — CI installs with `npm ci`; `package.json` declares
  yarn. Change dependencies in both.
- `scripts/seedGroupProjects.mjs` (the readable record of the group projects, referenced from
  `groupRubrics.ts` and docs) and `scripts/enable-module2-activity-log.mjs` (documented run
  instructions).
- `app/models/canvasUser.ts`, `canvasLineItem.ts`, `canvasCourse.ts` — groundwork for the
  Canvas grade sync.
- The Canvas/LTI setup docs in `documentation/` — linked from the README.
- `getUsers` vs `getUsersWithIds` — a deliberate split (teacher-only emails vs public fields).

Open decisions:

- **ESLint** — the config and packages are present but lint cannot run (`next lint` is gone
  in this Next.js). Either migrate to a flat `eslint.config.mjs` or remove them.
- **Large components** — `EvaluateTab.tsx` and `TeamHubTab.tsx` are ~900 lines each; not
  reviewed closely enough to propose a split.
- **Merge conflict ahead** — `feature/reverse-flash` also changes `package.json`/`yarn.lock`.
  Resolve by taking the merged `package.json` and re-running `yarn install` and `npm install`.

## 3. Prompt audit (instruction files for Claude Code)

The app makes no LLM API calls, so the prompt surface is the instruction files. Target model
assumed: Claude Opus 5.5.

- `documentation/CLAUDE.md` — **deleted** in `4af807c`. It gave the wrong category values
  (`"speciality code"`; the real value is `codeSpeciality` — the exact bug described in
  `utils/guideTaxonomy.ts`), a stale branch context, a `npm run lint` that no longer works,
  and seven shouted IMPORTANT/MUST/NEVER markers. Its one live fact (`module.number` is
  unreliable) is already in `app/utils/moduleUtils.ts`.
- `.claude/skills/react-doctor/SKILL.md` (and its identical copy in `.agents/`) — clean
  apart from one installer-facing sentence ("Updating the prompt at its source updates every
  agent…"), which could go. **Not changed**: the skill is vendored from react-doctor and a
  reinstall would overwrite the edit.
- Worth knowing: the skill's `/doctor` workflow fetches its real instructions from
  `react.doctor` at run time, so that part of its behaviour is not in this repo.
