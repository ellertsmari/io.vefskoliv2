# Activity log guide — agreed direction

Recorded 2026-09-09. Implemented in the working tree; not deployed or enabled
in the configured database yet. Exact reporting-year dates are still to be set.

## Implementation and activation

The guide editor now offers **Activity log — record hours & evidence** under
**How it is completed**. Save that choice, then open the guide as a teacher and
choose **Set up reporting year**. The form defaults to Autumn/Spring, 15 hours
each and a 10-hour activity cap; dates are entered explicitly, not guessed.

To convert the existing Module 2 guide and replace its old spreadsheet wording
after deploying this code:

```sh
node scripts/enable-module2-activity-log.mjs          # preview only
node scripts/enable-module2-activity-log.mjs --apply  # backs up the guide first
```

The migration targets exactly one community/networking guide in Module 2,
creates the activity indexes, preserves student Returns, and saves a private
backup under ignored `dbBackup/`. It does not invent credit from old spreadsheet
links. Existing spreadsheet records need deliberate reconciliation before any
new credit is entered, to avoid omissions or duplicate credit.

Implemented surfaces: student entry/draft/edit/delete, private evidence images,
semester progress and carry-forward, teacher overview/approval/feedback/batch
approval, CSV totals export, reporting-year setup/history, guide cards, student
reports, Continue Learning, and completion status for Canvas score calculation.
This does not add a new live Canvas synchronisation mechanism.

The existing Next.js/Vercel deployment architecture is retained; no Sites project,
hosting migration, or production database write was performed.

## User-confirmed requirements

- Add a reusable Activity log guide type. Module 2, Community & Networking,
  is its first use. Keep the guide's instructions and learning outcomes.
- Students record activity/event name, date, duration, description, location
  (including online activities), and one or two images. Supporting links can
  accommodate the existing guide's certificates, contributions, and other evidence.
- Require 30 credited hours overall: 15 for the semester before Christmas and
  15 for the semester after Christmas.
- Students may record more than 15 hours in a semester. Autumn credit above
  15 carries forward toward the following spring's requirement. Do not reject
  entries or discard credit merely because a semester target has been reached.
- Retain the guide's maximum of 10 credited hours per activity. The cap applies
  to the activity, not independently to every row if an activity spans entries.
- Build the capability so other schools can configure targets, periods, labels,
  evidence requirements, and activity caps rather than hard-coding Module 2.

## Credit allocation

Keep the date and duration of the actual activity unchanged. Show carry-forward
as an allocation of credit, not a rewritten date or a duplicated activity.
Store duration in minutes and calculate credited totals separately from recorded
time. Apply the activity cap before allocating credit to semester targets.

For the two-semester requirement, let A be eligible autumn credit and S be
eligible spring credit (after the activity cap and any required approval):

- Autumn requirement covered = min(A, 15 hours).
- Carry-forward from autumn = max(A - 15 hours, 0).
- Spring requirement covered = min(S + carry-forward, 15 hours).
- Both requirements must be covered to satisfy the 30-hour requirement.

| Autumn eligible hours | Spring eligible hours | Result |
| --- | --- | --- |
| 15 | 15 | Both requirements covered |
| 20 | 10 | Autumn covered; 5 carried forward; spring covered |
| 25 | 5 | Autumn covered; 10 carried forward; spring covered |
| 30 | 0 | Both hour targets covered through carry-forward |
| 10 | 20 | Autumn remains 5 hours short under forward-only allocation |

Interpretation to preserve: carry-forward moves to the next semester. Spring
hours do not retroactively fill an autumn shortfall unless the teacher introduces
an explicit exception policy. Carry-forward beyond this course's two-semester
requirement has not been specified; retain excess records without inventing
cross-course or cross-year credit.

## Proposed first version

- Student view: Add activity form, own entries and evidence, actual semester
  totals, credited progress, and an explicit carried-forward amount.
- Teacher view: spreadsheet-style student overview with semester progress,
  pending hours, entry/evidence details, individual or batch approval, and
  return-for-correction comments.
- Draft/pending/approved/needs-changes states. Pending time is visible separately;
  approved eligible time counts toward completion. Editing an approved entry
  requires review again, with totals recalculated.
- CSV export for reporting. A general-purpose form builder is outside this
  initial scope.

## Implementation notes

- Store activity entries separately from existing project Returns, which require
  project URLs and participate in a peer-review workflow.
- Associate entries with their student, guide, and stable course/reporting period.
  Calendar Semester currently has a single global active flag; do not use that
  flag alone to assign historical entries or carry credit between course years.
- Attribute entries by activity date, not submission date. Use configured period
  dates rather than hard-coded Christmas boundaries.
- Preserve activity identity across multiple entries so splitting a single
  activity cannot bypass the 10-hour cap. The exact grouping interaction still
  needs design, especially for ongoing open-source work or recurring events.
- Evidence should be accessible to the owner and authorised teachers by default.
  The existing Blob upload flow serves public showcase images. The first version
  instead stores at most two compressed JPEGs (400 KB each) with the activity,
  excluded from ordinary database queries and every list/progress payload. An
  authenticated, non-cacheable route serves the bytes. This keeps evidence
  private without requiring another storage credential and makes edits/deletions
  atomic. At larger white-label scale, move these bytes behind a private object
  storage adapter while retaining the same access checks and image URLs.
- Credit allocation must be deterministic and must not double-count entries.
  Recompute allocations after approval, corrections, deletion, or revoked approval.
- Keep completion/submission type distinct from assessment policy as the feature
  grows. Existing guides currently expose peerReview/auto through gradingMode.
- Update Module 2 instructions when shipping: the guide read through this
  checkout's configured database currently says 30 hours without timing
  constraints. That wording does not express the agreed semester/carry-forward
  policy. No guide/database records were changed during this design discussion.

## Deliberate first-version boundaries

- Reporting-year rules lock when the first valid activity is submitted; previous
  years remain available in the guide. A used year's rules cannot silently
  change earned credit.
- Duplicate activity names are normalised and rejected within a student's
  reporting year; adding another date edits the same activity ID. Teachers still
  judge whether differently named activities are actually the same activity.
- The teacher overview follows this LMS's current school-wide student directory
  (`user` and `student` roles). Configurable guide/year rules are reusable, but
  full tenant isolation and enrolment/cohort membership are separate platform work.
- The first version supports 1–2 evidence images and optional links. A custom
  evidence/form builder and importing spreadsheet rows are not implemented.

## Verification

- Production build and TypeScript compilation passed in `.next-verify`.
- Full regression run: 746 passed, 3 existing skipped tests. Final additions
  (report rendering and teacher-as-student isolation) and affected activity tests
  passed in focused runs after that full run.
- Build trace verification passed; the existing exercise runtime still ships
  its TypeScript libraries and QuickJS files.
- Migration script syntax and `git diff --check` passed.
- No live database migration, deployment, or browser interaction test was run.

Tests cover the allocation examples above, fractional-hour entries, the per-activity
cap across multiple entries, period boundaries, pending versus approved credit,
and recalculation after corrections. They verify student/teacher access to entries
and images and isolation between course periods.
