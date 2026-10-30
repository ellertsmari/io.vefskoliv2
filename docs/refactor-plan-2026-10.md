# Larger refactors (from the 2026-10-29 cleanup)

These came out of a whole-codebase review (reuse, simplification, efficiency, altitude) and were too large for the cleanup commit `4c49fc2`, which kept behaviour unchanged. Each workstream below is meant to be its own PR. Order is a recommendation, not a dependency chain, except where noted.

Line numbers are as of `2ad6b50` and will drift.

## 1. Guide loading and the guide data boundary (do this together with SEO Phase 1)

**Done on this branch (2026-10-29):**
- One loader, `serverActions/guideBoard.ts`: `loadStudentGuideBoard` and `loadPublicGuideBoard`. The dashboard, `/guides` and `getStudentGuides` all use it. Visitors get `extendGuides`' default statuses instead of hand-built ones.
- `module.number` is set from the title once, in the board. The views read `guide.module.number`.
- `getCompletionKind(guide)` in `utils/guideTaxonomy.ts` replaces the three-way switch in the editor, the editor list and the guide modal.
- On the student home page:
  - `isHandedIn` and `countsTowardProgress` replace three definitions of "returned". Failed guides are offered again in "Continue learning".
  - Handed-in cards that are waiting for reviews are yellow.
  - `isCountedModule` and `calculateModuleGrades` moved to `utils/guideUtils.ts` unchanged.

**Corrected:** the review said the dashboard ships review data it never reads. It does read it: dashboard cards open `GuideModal`, which uses `availableForReview`, `reviewsReceived` and the returns. Don't slim that payload.

**Still open:**
- Server code that reads guides straight from the database still parses the title: `canvas/routing.ts`, `editGuideActions.ts:83`, `api/guides/[id]/route.ts:177,263`. `getGallery.ts:93` reads the stored number. Fixing these needs the Compass backfill of `module.number` and `order`. The backfill would also let `makeRoomForOrder` stop loading every guide.
- On the public board, older guides embed the whole module document (long HTML descriptions, research-module references) in `module`. Project `module.title` / `module.number` in `getPublicGuides`. That shrinks the `/guides` page crawlers fetch, so it fits SEO Phase 1.
- `Serialized<T>` for `safeSerialize` (see below), after making `mergeOldAttempts` write plain values.

Original findings, for reference:

The guide data reaches the UI through three copies of the same pipeline, and each consumer repairs the data again.

- **One loader.** `LMS/dashboard/page.tsx:35-54`, `guides/page.tsx:18-35` and `serverActions/getStudentGuides.ts:20-37` each do getGuides → extendGuides → fetchModules → safeSerialize. Replace them with one loader returning `{ guides, modules }`.
  - Guests: `extendGuides(publicGuides.map(createPublicGuideInfo))` already produces the default statuses that `guides/page.tsx:62-74` writes by hand.
  - One visible difference: guest activity-log guides would show review status N/A instead of "Awaiting projects". That's correct, but check it on the page.
  - `getStudentGuides` swallows errors and returns `[]`. The shared loader must throw, or pages show "no guides" instead of the error state.
- **Module number once.** `extractModuleNumber(guide.module.title)` is called at 17 sites (StudentHomePage, ReportsPage, GuideCard, Guides, canvas/routing, editGuideActions, api/guides/[id]). Meanwhile `getGallery.ts:93` reads the stored `module.number`, so the two have already drifted.
  - Either set it once in the loaders, or backfill `module.number` and `order` (as an int) by hand in Compass (never by script, see memory `db-changes-via-compass`).
  - The backfill also lets `makeRoomForOrder` (`api/guides/[id]/route.ts:165-190`) stop loading every guide, and lets `.sort({ order: 1 })` sort numerically.
- **Slim client payload.** StudentHomePage never reads `availableForReview`, `reviewsReceived`, `reviewsGiven`, `returnsSubmitted` or `gradesGiven`, but they are all serialized into the page. Map to the fields each view uses before serializing.
- **`Serialized<T>`.** `safeSerialize<T>(obj): T` claims to return the type it was given. Return a mapped type (ObjectId/Date → string) so the compiler shows which `toString()` / `new Date()` calls and double serializations are redundant.
  - Careful: `getGuides` runs `mergeOldAttempts` *after* serializing and puts a raw ObjectId and Date back. Fix that first.
- **`getCompletionKind(guide)`** in `utils/guideTaxonomy.ts`. The activityLog / auto / peer-review switch is written at about 10 sites.
- **StudentHomePage rules into `utils/guideUtils.ts`.**
  - The "returned/complete" test is written 6 times with **3 different definitions**. This is a behaviour decision, not a refactor: choose one.
  - The module exclusion `number !== 0 && number !== 2` appears 3 times.
  - The module-average policy lives in a client component. Canvas grade sync will need it on the server.

**Why with SEO Phase 1** (`docs/handoff-2026-10-23.md`): Phase 1 changes the same files. It drops the spinner gate in `Guides.tsx`, moves the module filter from localStorage to `?module=`, hides drafts in `getPublicGuides`, and builds the sitemap and per-guide titles from guide + module name. Doing the loader first gives Phase 1 one place to put draft filtering and one module list for both the sitemap and the filter.

## 2. Auth and the session

- **Four meanings of "teacher".**
  - `hasTeacherPermissions` = the real teacher; `isActingAsTeacher` = the effective role.
  - groups' own `isTeacher` (`serverActions/groups/helpers.ts:26`, 23 call sites) is the raw role.
  - There are 12 raw `session.user.role === "teacher"` reads.
  - Aliasing overwrites `session.user.role`, so a raw check silently means "acting as". Each site needs a deliberate choice when it is converted.
  - Add `requireUser()` / `requireTeacher({ acting })` in `app/lib`, typed `role` as a union, and an effective `user` plus a real `actor` on the session. Move `objectIdSchema` / `requireSession` out of groups so everyone can use them.
- **`auth()` reads the database on almost every call.**
  - After 15 minutes `refreshToken` (`lib/sessionToken.ts:43`) re-reads the user on every call, because server components can't write the refreshed cookie back.
  - A guide page calls `auth()` about 5 times, the calendar about 7.
  - Wrap the exported `auth` in React `cache()`. Do the refresh where the cookie can be written (the proxy now runs on Node). Use `.select().lean()`.
- **Alias resolved per call.** The session callback reads the alias cookie and runs `User.findById` on every `auth()`. The 9 profile fields are listed 8 times (`sessionToken.ts`, three times in `auth.ts`, four times in `types/next-auth.d.ts`).
  - Fix: resolve the alias in the jwt callback via `updateSession()`, reuse `snapshotUser`, and define one `SessionProfile` type.
  - Also remove `JWT.isAliased` / `aliasedUserId` / `originalUser`: they are never set.
- The `authorized` callback in `auth.config.ts` is never enforced, because `proxy.ts` wraps a custom function. Delete it or make the proxy use it.
  - The per-page `/signin` redirects stay: they are deliberate defence in depth (see the comment in `LMS/people/page.tsx`).

## 3. Root layout via route groups

`app/layout.tsx:30-44` calls `auth()` and switches layout on an `x-pathname` header that `proxy.ts:52-62` injects. That is a third hand-kept route list, and because the root layout reads the session and headers, every route is dynamic.

Route groups such as `(standalone)` for `/`, judge and showcase, and `(lms)` for the rest, remove the header and the list. `app/guides/layout.tsx` then shrinks to its metadata only (its body is already a passthrough).

This interacts with SEO: a cached guest view of `/guides` is only possible once the root layout stops reading the session and headers for every route.

## 4. Query efficiency

- `getUngradedReviews.ts:56-75`: 1 + 4N queries, and the teacher home calls it just for a count. Use one aggregate, and `countDocuments` for the card.
- `getGallery.ts:38-110` (public landing page): scans every return and joins its reviews. Start from `Review` matched on the gallery vote, group, limit 4, then look up. Also cache it.
- `groups/getGroupProjects.ts:48-95`: 2–4 queries per project. Use `$in` queries grouped in memory.
- `groups/manageTeams.ts:128-139` and `shortAnswerReview.ts:215-226`: one sequential write per change. Use `bulkWrite`.
- `Zoom/getZoomRec.ts:91-141`: one sequential, uncached fetch per month. Fetch the months in parallel and cache finished months.
- `lib/lti-grading.ts:24`: a new OAuth token on every call. Cache it until it expires, as `zoomToken.ts` does. Leave this until the Canvas key exists.

## 5. UI kit reuse

- Dialogs: `LMS/calendar/EventForm.tsx`, `BookMeetingDialog.tsx` and `components/editGuides/FocusMode.tsx` each hand-roll a portal, an overlay, Escape handling and the scroll lock. Add Escape to `UIcomponents/modal/ModalContent` and use it in all three.
- `MemberAvatar` and `initials` in groups (5 users) duplicate `UIcomponents/avatar`.
- About 20 `styled.input` / `textarea` / `select` in 12 files bypass `UIcomponents/input`.
- Groups' `SelectableChip` duplicates `CapsuleButton`.
- The kit has two `ErrorState` components (`states/States.tsx` and `errorState/ErrorState.tsx`). Merge them, and replace the local empty and loading states in reports and people.
- About 10 local `toLocaleDateString("en-GB", …)` formatters and 4 hand-built UTC day keys. Move `LMS/analytics/format.ts` and `dayKey()` into `utils/` and use them everywhere.
- The activity-log images run their own resize pipeline (`ActivityForm.tsx:8-26`). Reuse `compressImage` and the `IMAGE_*` constants.
- Form state: `ProjectSettings`, `EventForm`, `PreferencesForm` and `TeamHubTab` keep one `useState` per field. Move each to a single form object, as `profile.tsx` does.
- Smaller items:
  - A shared `ProjectDetailsFields` for `GroupsListView` and `ProjectSettings`.
  - A `lookupOwn()` builder for the three near-identical `$lookup`s in `getGuides`.

## Needs a decision from Smári

- `gradeExercise` / `tasksToGrade` (`utils/exerciseUtils.ts:467-560`) are not used in production any more, but 33 tests use them. Which of those tests get rewritten against `gradeTask` / `deriveAttempt`, and which go?
- Compass backfills: `module.number` + `order` on guides (see 1), and `status` on legacy users. The member query is spelled `status: { $ne: "pending" }` at 6 sites because old users have no `status`. Add a `role` enum while at it: `activityLog.ts:83` still queries `["user", "student"]`.
- The 3 definitions of "returned/complete" on the student home page (see 1).
