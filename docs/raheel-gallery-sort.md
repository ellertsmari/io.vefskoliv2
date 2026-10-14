# Raheel: gallery sorting

Project location on ASU: D:\internship project\tomonika-hyperisland

## Branch and team workflow
Use feature/<task-name> with lowercase words separated by hyphens.
Raheel's sorting branch is feature/gallery-sort (already existed; reused).
The observed team workflow is a pull request into dev-hyperisland, with Monika reviewing.
Do not push, open a PR, or deploy until the user explicitly authorizes it.

## Task
The supplied Notion screenshot assigns SORT BY DROPDOWN to Raheel, High priority.
Other cards are not confirmed Raheel assignments.
Options implemented: Most recommended (default), Newest, Oldest.
Recommendation ties use newest first; date ties use return ID.
Missing/invalid dates sort last. Sorting copies the list and preserves search and filters.
These options were present in the existing local work; exact options were not verified against FigJam.

## Team updates incorporated on 2026-10-10
Fetched origin and incorporated all commits from main, dev-hyperisland,
feature/gallery-search and feature/filtering into the local sorting branch.
Latest team base: a3b0918.
Yuliia's search PR #1 is merged into dev-hyperisland.
Monika's filtering branch includes module, category and year filtering.
No additional remote branch or commit attributable to Isabella was found.
Original local sorting work is preserved in a named Git stash.

## Raheel files (relative to project root)
- app/components/gallery/Gallery.tsx: sorting dropdown and filtered-list integration
- app/components/gallery/styles.tsx: sorting control layout and four desktop controls
- app/components/gallery/sortGalleryItems.ts: sorting logic
- __tests__/gallerySort.test.ts: recommendations, dates, ties, invalid dates, immutability
- __tests__/gallerySorting.test.tsx: dropdown interaction with search and combined filters
- __tests__/serverActions/getGallery.test.ts: preserved existing createdAt assertion
- docs/raheel-gallery-sort.md: project handoff and branch convention

Monika's getGallery.ts already supplies createdAt; duplicate local additions were removed.

## References
Repository: https://github.com/monika-hyperisland/tomonika-hyperisland
Live app: https://tomonika-hyperisland.vercel.app/
Notion: https://app.notion.com/p/3f2b20b31ee480ebb877c6d8ede5e3c5
FigJam: https://www.figma.com/board/N6irOUnmLGUljSyuBQUSxO/Design-Sprint--form--Copy-?node-id=0-1
Notion connector returned an access error; use supplied screenshot.
Initial FigJam read succeeded; further calls hit the Starter-plan limit.

## Validation
Five sorting and component tests passed.
Final TypeScript check and production build passed. Build logged missing MONGODB_CONNECTION; live data was not verified.
React Doctor scored 95/100 with one warning in existing authenticate.ts.
Database integration tests blocked by Windows ARM MongoDB binary availability;
x64 retry encountered a download cache lock error.
Sorting work committed locally; no push or PR authorized. Local test account and six sample projects were added only to tomonika_local.
