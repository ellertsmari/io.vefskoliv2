# Guide content fixes — August 2026

Changelog for the editorial review of the 46 guides in `dbBackup/Hopur11.guides.json`.
That file is gitignored (the database does not belong in the repo), so this document
is the review record instead.

**Applying it:** the edited collection goes in through **MongoDB Compass**, by hand — no
scripts are run against any database. Compass imports by *inserting*, so the existing
`guides` collection has to be dropped first or every document collides on `_id`. All 45
documents keep their original `_id` (extended JSON, `{"$oid": …}`), which is what makes
that safe: `Return.guide` and `Review.guide` reference guides by `_id`, so every student
return and review stays attached across the reimport. An import that re-minted the `_id`s
would orphan the lot.

Group-project changes are **not** in that file — they live in
`scripts/seedGroupProjects.mjs`. That script is tracked in git and is the readable record
of the module briefs and rubrics, but it is **not run**; its changes reach the database
either through the teacher Settings tab in the app (description only) or as a hand edit in
Compass (rubric, which has no UI).

New image assets live in `public/guides/` and are tracked in git — deploy them with the app,
or the four images below will 404.

## Still open

Ordered by what unblocks what. Item 2 is done (see #23); the rest is unapplied.

### 0. Not yet imported

The edits in this document exist only in `dbBackup/Hopur11.guides.json`. **Nothing has been
imported.** To apply: drop the `guides` collection in Compass, then import that file (see
*Applying it* above — the `_id`s are preserved, so returns and reviews survive).

Two things to check before dropping. Production had no `gradingMode`/`exercise`/`discipline`
fields when checked, so a wholesale replace loses nothing; if the quiz feature has since reached
production, those fields are **not** in this file and a drop would erase them. And deploy
`public/guides/` alongside the app, or four images 404.

### 1. Spring 2027 schedule → unblocks the parked #12

`scripts/seedGroupProjects.mjs:371` seeds the Module 5 group project for **2027-01-04 → 2027-01-29**,
directly over the confirmed early-January Las Palmas trip. Module 5 is no longer running in January.
Once the real dates exist, three places need them:

- `scripts/seedGroupProjects.mjs` — Module 5 and Module 6 startDate/endDate (header already calls
  the spring 2027 dates provisional)
- `app/LMS/calendar/calendarData.ts` — currently stops at 2026-12-31, so January 2027 is unmodelled
- `Back end - Next.js with Postgres` — the opening "Hello everyone and happy new year! … this first
  guide on a new year" no longer matches. Keep "the darkest time of the year"; it is accurate for
  January in Iceland. Keep the Las Palmas and Danish/Spanish student references; the trip is a real
  recurring fixture (fragile — it runs with two partner schools).
- Check `Design UX - Las Palmas Facilitator 24h` (Module 6, order 6) still lands *before* the trip.

### 2. Merge the TypeScript fundamentals — DONE (see #23 below)

Done on 2026-08-12, after the exercise engine was extended to support short-answer and code
tasks (`docs/exercise-engine-tasks.md`). The full write-up is in **#23**.

### 3. Curriculum gaps, confirmed but unwritten

| Gap | Suggested home | Note |
|---|---|---|
| **Testing** | Module 6 | Nothing exists. The repo itself uses Jest, and Module 6's group project invites students to contribute to io.vefskoli.is — they meet tests there with no preparation |
| **TypeScript depth** | inside the React guides | generics/unions/type guards/tsconfig all absent. Design as part of item 2 above, not separately |
| **Env vars & secrets** | Module 5 Next.js guide | `.env.local` vs `.env.example`, server-only vs `NEXT_PUBLIC_`, and rotating a key you committed by accident |
| **Responsive / media queries** | HTML & CSS - Layouting | "responsive" is required in 9 places; breakpoints are taught nowhere. Tailwind's `sm:`/`md:` prefixes let students satisfy the requirement without meeting the mechanism |

### 4. Left deliberately, revisit if you disagree

- Required guides sitting after optional specialities: `GitHub - Branches and Pull Requests`
  (M3, order 13, after specialities at 11–12) and `Design UX - Las Palmas Facilitator` (M6, order 6,
  after the speciality at 5)
- Discipline grouping differs per module — M3 design-then-code, M4 code-then-design, M6 alternates.
  Fixing it properly needs the teaching timetable
- `state-management-tree.png` is a third-party diagram from a Medium article, now self-hosted. It is
  also labelled "Without Redux / With Redux" for a guide that teaches Context first
- The `React - State` cartoon has **"DYNAMTIC"** misspelled in the artwork
- Informal assignment titles kept as voice: `Idea for return` (×2), `ANIMATION IN FIGMA`,
  `Collaborative work effortness of unity`

## Final state

**42 guides** (was 46: one hidden duplicate deleted, then four TypeScript guides merged into one),
**241 KB** (was 428 KB).

Automated checks, all passing:

| Check | Result |
|---|---|
| No dead hosts in any link | 192 links |
| Local images present in `public/guides/` | 4 images |
| Internal `/guides/…` links resolve | 2 links |
| Every module contiguous from order 0 | 8 modules |
| No base64 data URIs | — |
| No placeholder rows | — |
| `knowledge` + `skills` + `topicsList` on every guide | 42/42 |
| No empty outcome entries | — |
| At least one resource per guide | 42/42 |
| Assignment titles 1–80 chars | 42/42 |
| Balanced `<p>` tags | — |

Snapshots of anything deleted:
`dbBackup/deleted-design-sprint-guide-2026-08-11.json`,
`dbBackup/deleted-typescript-intro-guides-2026-08-12.json`,
`dbBackup/deleted-local-test-guides-2026-08-11.json` (local `test` DB only).

---

## #24 — Two dead internal guide links

`Getting started - Tooling` and `Getting started - Concepts` link to each other with
`href="/guides/getting-started-tooling"` and `href="/guides/getting-started-concepts"` — the
guide's `uid`. But `findGuide` (`app/serverActions/getGuide.ts:12`) returns null for anything
that is not a valid ObjectId, so both rendered "Guide Not Found". These are the first two guides
a student reads, pointing at each other.

Both now use the target's `_id`. Note the coupling this creates: the links are correct only as
long as guide `_id`s are preserved across an import, which is already required for returns and
reviews to stay attached.

---

## #23 — The four TypeScript Introduction guides became one auto-graded guide

Module 3's Data types (7), Conditionals (8), Loops & Iterators (9) and Functions (10) are now a
single guide, **TypeScript Introduction (16h-20h.)** at order 7, with `gradingMode: "auto"`.

**Why it waited.** The original plan was one auto-graded *quiz*. But all four guides carry skill
objectives phrased as doing — "Be able to use loops and iterators" — and a multiple-choice engine
cannot assess one of them. Merging onto a quiz-only engine would have meant rewriting four skill
objectives into knowledge objectives so the tool could measure them, letting the engine set the
curriculum. So the engine was extended first (short answer, then code tasks running in a sandbox);
this merge came after. All five skill objectives survive, and a sixth was added: *be able to read a
TypeScript error and fix what it points at*, which is now genuinely assessed because submissions
are type-checked before they run.

**The exercise.** 25 tasks, of which each visit serves 14:

| Type | Authored | Served | Assessing |
|---|---|---|---|
| quiz | 17 | 10 | the knowledge objectives across all four topics |
| short answer | 4 | 2 | recall — `const`, `length`, `return`, "truthy" |
| code | 4 | 2 | the skill objectives, by running the student's TypeScript |

70% to pass, unlimited attempts, best score counts. Every question carries a hint, an explanation
and a knowledge goal, so students get per-goal feedback.

The four coding problems are lifted from the assignments they replace, so nothing was invented:
`totalChildren` (the Loops guide's "how many children in total"), `greetByCountry` (the
Conditionals guide's Iceland/Spain/Korea branches), `describePeople` (the Loops guide's
`name: Age` formatting) and `addContact` (the Functions guide's contact list, with its
"Missing fields" / "Duplicate was found" messages). Each has 3–5 test cases with at least one
hidden, and requires a construct — `iteration` rather than `loop`, so `.reduce()` is not punished.

**Verified before shipping**, since there is no authoring UI to fix a bad test case with: a
reference solution for each coding problem passes every case and satisfies its construct; the
untouched starter code fails; every quiz key indexes a real option; every short answer accepts its
own accepted answers; no answer key or hidden expected value survives `sanitizeExerciseForClient`;
the served shape is identical across 25 draws; and a fully correct submission scores exactly 10.

**Watch this on import.** Every task carries an explicit `_id`. Mongoose mints subdocument ids on
save, but this collection is imported by hand as raw JSON and **nothing generates them there** —
without ids every task shares the id `""`, which collapses answer keying, pooling and grading.
Stored attempts key their answers by these ids, so they must not be regenerated once students have
submitted.

**What changed around it:**

- **Deleted** the four guides; snapshot at `dbBackup/deleted-typescript-intro-guides-2026-08-12.json`.
  Any returns or reviews from past cohorts against those four `_id`s are orphaned — accepted
  deliberately.
- Collection: **45 → 42 guides**. Module 3 resequenced and contiguous 0–10 (Web APIs 11→8,
  prototype handoff 12→9, GitHub 13→10).
- The cross-reference block ("This guide is part of the TypeScript Introduction Guides. Please
  follow the order:") is gone with the guides that carried it.
- **Mockaroo is retired.** The CSV/JSON mismatch between guides, the switch branches that
  essentially never fired, and the 200-request/day key shared across a class are all gone. The
  anti-copying property it may have been reaching for is now provided properly by per-type question
  pools — students draw different coding problems from the same pool.
- **Codewars survives** as optional extra practice inside the merged guide, dinner bet included.
- `Reading code` (order 6) is unchanged: it is still the pre-TypeScript self-check.

**Still to decide:** the four guides were 22–27h and the merged one is set at 16–20h, so roughly
**6–10h of Module 3 is freed**. Less than the 22–27h originally imagined, because students still
write code — what is saved is three hand-in cycles and their peer reviews, not the learning. What
fills that time is a curriculum call.

---

## #2 — Module 3 design sequence

`Design UI - Wireframe` asked students to build from a moodboard that came one guide later.

| Guide | Field | Before | After |
|---|---|---|---|
| Design UI - Moodboard (4-6h) | `order` | `2` | `1` |
| Design UI - Wireframe (6-8h) | `order` | `1` | `2` |
| Design UX - Design Thinking | `themeIdea.description` | "…in the next guide: Wireframe." | "…in the next guide: Moodboard." |

Resulting order: Design Thinking (0) → Moodboard (1) → Wireframe (2) → Style Guide (3) → Hi-Fi Prototype (4).

## #3 — Figma - Introduction

The guide ended "Below you can see what every tool in figma does." with nothing after it.

- **`description`** — replaced the dangling sentence with a pointer to *the materials section*
  (no position word, so it survives UI changes). Added a warning that Figma's 2024 UI3 redesign
  moved the toolbar to the bottom, so older tutorials describe buttons in the wrong places.
- **`description`** — `<a href="figma.com">` was a relative link resolving against the LMS route;
  now `https://www.figma.com`, with a note about Figma's education plan.
- **`resources`** — replaced designcode.io Figma handbook (pre-UI3) with:
  - Figma Design help centre — `help.figma.com/hc/en-us/categories/360002051613-Figma-Design`
  - Keyboard shortcuts — `help.figma.com/hc/en-us/articles/360040328653` (bare article ID; Zendesk
    rewrites slugs when titles change, so the ID form will not rot)
- **`classes`** — replaced Designlab "Figma 101" (pre-UI3) with:
  - Figma Design for beginners — `help.figma.com/hc/en-us/sections/30880632542743`
    (Figma's own course, rebuilt April 2025 for UI3)
  - Figma's YouTube channel — `youtube.com/@Figma`

Same "materials are not below anymore" fix applied to two other guides:

| Guide | Before | After |
|---|---|---|
| TypeScript/React - React Native | "one of the tutorials linked below" | "one of the tutorials in the materials section" |
| Back end - Next.js with Postgres | "can be found in the \"Material\"" | "is in the materials section" |

## #4 — Factual errors

**TypeScript/React - React Native.** The old paragraph claimed Dart was a "multi platform
framework" "written in a programming language called GO". Both false.

- **`description`** — rewritten: Dart is the *language*, **Flutter** is the framework built on it.
  Added the native route (Swift/Objective-C for iOS, Kotlin/Java for Android) with its trade-off.
  Added the point that AI assistants have made unfamiliar *syntax* cheap, while learning how a
  platform thinks — its building blocks, state, layout, navigation, and spotting wrong generated
  code — has not got easier. Offers building the same app twice as an ambitious option.
- **`themeIdea.description`** — "using React Native, Dart or similar framework" →
  React Native, with explicit permission to use Flutter/Swift/Kotlin/anything else if they
  justify the choice in the README. Also fixed "an front end" → "a front end".
- **`topicsList`** — "React Native (or Dart)" → React Native, Expo, cross-platform vs native,
  Flutter and Dart, Swift / Kotlin.
- **`skills`** — "Be able to use React in a platform different from the browser" →
  "Be able to build a working app for a platform different from the browser" (the old wording
  would not hold for a student who picks Swift).
- **`knowledge`** — added "Understand the difference between cross-platform and native app
  development, and the trade-off between them".

**React - Components.** Called React "the framework that won the framework wars" while its own
knowledge objectives assess library-vs-framework.

- **`description`** — rewritten so the contradiction becomes the lesson: React is a library,
  the distinction is who calls whom, Next.js (Module 5) is the framework with React inside it.
  Acknowledges that people say "React framework" casually.
- **`description`** — "groupwork in Module 4" → "the group project at the end of this module"
  (the guide is *in* Module 4).

## #5 / #14 — Accessibility folded into existing code guides

No new guide. Accessibility was previously design-track only; developers never implemented the
annotated handoff the designers produce.

**HTML & CSS - Introduction**
- `description` — added two paragraphs: why the tag *is* the accessibility work (`div` vs `nav`,
  `button` vs clickable div, keyboard support for free), and the European Accessibility Act,
  in force across the EEA including Iceland since June 2025.
- `topicsList` — new "Accessibility basics" section: alt text, heading order, landmarks, Tab navigation.
- `knowledge` — +2 items (the tag communicates meaning; what alt text is for and why heading order matters).
- `skills` — +1 ("Be able to write a page that someone can use with only a keyboard").
- `themeIdea.description` — new requirement block: alt on every image (`alt=""` for decorative),
  exactly one `h1` with no skipped levels, and a mouse-down Tab-through with visible focus.

**React - Components**
- `description` — carries the habit into JSX: clickable means `<button>`; every control needs a
  readable name; make the label a prop on icon components.
- `topicsList` — + semantic JSX, accessible name (aria-label), why a div is not a button.
- `knowledge` / `skills` — +1 each.
- `themeIdea.description` — keyboard pass before hand-in.

**React - Styling**
- `themeIdea.description` — "don't have any HTML tags left anymore" → "any **bare** HTML tags left
  in your JSX", plus an explicit warning that this does *not* mean dropping semantics
  (`styled.nav`, not `styled.div`). Added `:focus-visible`, 4.5:1 contrast with DevTools, and
  the note that hover-only affordances are invisible to keyboard and touch users.
- `topicsList` — was a malformed fragment (`<li>` with no `<ul>`); now a proper list with the
  focus/contrast topics.
- `skills` — +1 ("style a component without breaking its focus states or its colour contrast").

**Module 4 group project** — `scripts/seedGroupProjects.mjs`
- The rubric had an `accessibility` row with `discipline: "design"` and no code equivalent.
  Added a `code` row, **"Accessibility — implemented"**, graded by walking the main flow with the
  keyboard alone.
- Project requirements — keyboard operability is now a hard requirement, to be demoed live.
- Presentation programme — accessibility walkthrough added to the Programming slot.

## #6 — Placeholder sweep and materials backfill

**Deleted 33 placeholder rows** across 18 guides: `"this is not used" → "edit link"`,
`"edit materials" → "edit link"`, `"edit reference" → "edit link"`, whitespace-only rows,
and `"None" → None`. Also dropped two named-but-linkless rows that duplicated a link the guide
already had: "Expo documentation" (React Native) and "design sprint kit" (Las Palmas Facilitator).

**Added 42 resources across 25 guides.** Every link verified with a live HTTP check.

Guides that had no materials at all:

| Guide | Added |
|---|---|
| Design UI - Data visualization | data-to-viz.com; Fundamentals of Data Visualization (Wilke, free online) |
| Design UI - Design of Fortune! | Figma guide to variables (design tokens); Awwwards |
| Back-end - Workshop | roadmap.sh/backend; MDN HTTP |
| Back-end - NoSQL in the cloud | MongoDB manual; MongoDB University |
| Community participation & Networking | opensource.guide/how-to-contribute; First Contributions |
| Further Exploration - Future of Design | NN/g articles; W3C accessibility intro |
| Further Exploration - Future of Web Dev | web.dev; Chrome developer blog; State of JS |

Guides that had classes but no reference material:

| Guide | Added |
|---|---|
| Getting started - Concepts | MDN "Your first website" |
| HTML & CSS - Layouting | MDN CSS layout; CSS-Tricks flexbox + grid guides; Flexbox Froggy; Grid Garden |
| Reading code | Google's code review guide |
| React - Components | react.dev "Your First Component" |
| React - Props | react.dev "Passing Props to a Component" |
| React - State | react.dev "State: A Component's Memory" |
| React - Fetch | MDN Using Fetch; react.dev "Synchronizing with Effects" |
| React - Styling | MDN `:focus-visible`; WebAIM contrast checker |
| Design UI - Accessible UI | WCAG 2.2 quick reference; WebAIM contrast checker |
| Design UI - Smart Components | Figma component properties |
| Design UI - Atomic Design | Brad Frost's book (full text, free) |
| Design UI - Redesign | NN/g 10 usability heuristics |
| SPECIALITY - prototype handoff | Figma Guide to Dev Mode |
| Design UX - Design Sprint | thesprintbook.com |
| Back end - Next.js with Postgres | Next.js docs |
| SPECIALITY - Continue the MongoDB tutorial | MongoDB CRUD docs; MDN HTTP methods |
| SPECIALITY - Prismic CMS | Prismic docs |
| CMS system | jamstack.org headless CMS list; Prismic "what is a headless CMS" |

Result: 0 placeholder rows remain, and all 46 guides now have at least one resource.
The React resources deliberately point at **react.dev**, not the old reactjs.org pages —
see #18, which cleans up the remaining legacy links.

## #7 — Dead images and links

### Images

New assets live in `public/guides/` and are referenced as `/guides/…`. Verified safe:
`next.config.mjs` sets no `basePath`, and `proxy.ts:40` already excludes `.png`/`.svg`
from the middleware matcher.

| Guide | Was | Now |
|---|---|---|
| Javascript/React - State Management | GitHub **camo** proxy URL, 403 outside GitHub — the "(see picture below)" diagram never rendered | `/guides/state-management-tree.png` — the original image, recovered from the Medium CDN URL encoded in the camo path, now self-hosted |
| Back end - Next.js with Postgres | `samcurry.net/…next-framework.jpeg`, 404 | `/guides/nextjs-request-journey.svg` — newly drawn: browser → Next.js server → Postgres, plus static / server / client rendering |
| Design UI - Data visualization | `files.oaiusercontent.com/…` with a SAS token that expired 2024-02-01 | `/guides/choosing-a-chart.svg` — newly drawn: four questions and the chart that answers each |

All three now have real `alt` text describing the content, which they did not before.

> Provenance note: `state-management-tree.png` came from a Medium article
> (`cdn-images-1.medium.com/max/1600/1*87dJ5EB3ydD7_AbhKb4UOQ.png`) and was already being
> hot-linked by the guide. It is now copied into the repo rather than linked. If you would
> rather not host someone else's diagram, say so and I will draw a replacement — the
> Redux-specific labelling is arguably wrong for a guide that teaches Context first anyway.

### Links

| Guide | Was | Now |
|---|---|---|
| CMS system | `payloadcms.com/docs/getting-started/what-is-payloadpay` (404, typo) | `…/what-is-payload` |
| SPECIALITY - TypeScript Web APIs | `p5js.org/learn/` (404) | `p5js.org/tutorials/` |
| HTML & CSS - Layouting | freeCodeCamp `responsive-web-design/basic-html-and-html5/` and `/basic-css/` (404, curriculum retired) | `freecodecamp.org/learn/2022/responsive-web-design/` |

### Glitch shut down

`glitch.com` now redirects to a farewell post dated **23 July 2025** — no new projects, no
hosting. Four places still sent students there. Replaced with GitHub Pages, which the
deliverables already required anyway:

- **Getting started - Tooling** — "Create accounts on Github, Repl.it and Glitch" →
  "Create an account on Github". Removed the Repl.it and Glitch links from the topics list,
  added GitHub Pages as a topic, added a final assignment step (turn on Pages, open the live
  URL, send it to someone). Resources gained `pages.github.com`; classes gained a video walkthrough.
- **Getting started - Concepts** — the opening instruction to "get yourself a Glitch account"
  now points at VSCode: make a folder, make an index.html, change it, refresh.
- **HTML & CSS - Introduction** — the Glitch sandboxing resource became the GitHub Pages quickstart.

## #22 — Curriculum gaps: triaged, not fixed

Reviewed and split into four backlog items. No guide content changed.

| Gap | Evidence | Where it would go |
|---|---|---|
| **Testing** | vitest/jest/playwright/cypress: **0 mentions**. Appears once, as one of ~12 optional topics for a 10–15 min student workshop | Module 6. Note the repo itself uses Jest, and Module 6's group project invites students to contribute to io.vefskoli.is |
| **TypeScript depth** | generics 0, union types 0, type guards 0, tsconfig 0 | Depends on #23 — likely inside the React guides, matching "practise these topics in React" |
| **Env vars & secrets** | `.env` 0, "environment variable" 0, "secret" 0 — while M4 holds API keys and M5 connects databases | Fold into the Module 5 Next.js guide |
| **Responsive / media queries** | "media quer" 0, "breakpoint" 0 — but "responsive" is a *requirement* in 9 places | HTML & CSS - Layouting, which owns every other layout tool |

### Two findings from the original review were withdrawn

Both were false positives from counting keyword mentions:

- **"Async is the biggest unbridged jump."** Wrong. Promises are introduced as `.then` callbacks,
  and the Functions guide already teaches **Callbacks** and **Higher-Order functions & Closures** —
  precisely the groundwork `.then(callback)` requires. `async/await` deliberately comes later as
  sugar. That is a standard sequence, not an omission.
- **"Reading code is mis-sequenced."** Wrong — see #10.

The method's limit is worth stating plainly for whoever reads this next: counting keywords measures
the *guide text* only. There are also lectures and a weekly plan (`docs/Autumn semester plan .xlsx`).
Absence from a guide is not absence from the course.

Raised but **not** confirmed as gaps: debugging and stack traces, custom hooks, form validation,
error boundaries and loading states.

## #21 — Duplicate sprint guides

`Design UX - Design Sprint` (Module 4, order 8) and `Design UX - Las Palmas Facilitator 24h`
(Module 6, order 6) both asked for a 5-day double-diamond sprint schedule. The Module 4 one was
**hidden**, so students never saw it — the duplication was dormant rather than active.

- **Deleted** `Design UX - Design Sprint`. Snapshot kept at
  `dbBackup/deleted-design-sprint-guide-2026-08-11.json` if it is ever wanted back.
- Collection: **46 → 45 guides**. Module 4 resequenced to close the gap
  (Figma Animations 9→8, React Motion 10→9). All eight modules remain contiguous from 0.
- Its one unique idea — that the schedule feeds the Module 4 group project — moved into
  `Design UX - Design Thinking`'s assignment: *"if your group runs a design sprint in the Module 4
  project, this is exactly the material you bring to day one — a sprint with no research behind it
  is five people guessing in a room."*
- `Design UI - Redesign` had a whitespace-only entry in `skills`; removed. No empty
  knowledge/skill entries remain anywhere.

The only hidden guide left is `SPECIALITY GUIDE - Checking out the Prismic CMS system`.

## #20 — Prose errors and typos

**46 spelling corrections** across 45 distinct misspellings, applied to text fields only
(`link`, `uid`, `_id`, `$oid`, `$date` were skipped so no URL could be corrupted). Among them:
`loosing`→losing, `workinglife`→working life, `programminglanguages`→programming languages,
`crazyness`→craziness, `excersice`→exercise, `concistent`→consistent (×2), `methodologys`→methodologies,
`intrduction`→introduction, `yourown`→your own, `throug`→through, `Shardcn`→Shadcn,
`TyoeScript`→TypeScript, `ustomisable`→customisable, `comming`→coming.

Two needed context rather than find-and-replace:

- **`thin`** — a typo in Reading code ("Comment what you thin each part of the code does") but
  **correct** in Design of Fortune ("thin borders"). Only the first was changed.
- **`realy`** — "most likley realy on keyboard" → "most likely rely on keyboard".

### Factual prose fixes

| Guide | Was | Now |
|---|---|---|
| Back-end - Workshop | "**HTTPS** - The protocol that transfers our HTML… from the server to the client" | "**HTTP** - …" plus a sentence explaining HTTPS is the same protocol over an encrypted connection. (The link already pointed at MDN's HTTP overview — only the label was wrong.) |
| Back-end - Workshop | "how people would react to the background **being ping**" | "how people would react to **a pink background**" |
| Back-end - Workshop | `Kupernetes` | `Kubernetes` |
| TypeScript - Data types | "To do that, you can use GitHub Pages `<p>`TypeScript is a superset of JavaScript…" — two sentences collided, the first truncated, with a `<p>` opened inside a `<p>` | Split into two paragraphs: you don't need a website to try this (compile and read the output in the terminal or console; GitHub Pages is for *showing* someone), then the TypeScript-compiles-to-JavaScript explanation |
| TypeScript - Data types | assignment required "Use strict mode" | Removed — implicit in TypeScript modules, a leftover from the JS-era version |

Verified afterwards: no misspelling from the list survives, and no guide has unbalanced `<p>` tags.

## #19 — Design UI - Accessible UI: factual corrections

| Was | Now |
|---|---|
| "the score is AA and AAA and our goal is to get as close as we can to the AAA" | **AA is the level you have to hit** (EAA, client contracts); AAA is a bonus and sometimes unachievable. Real numbers given: 4.5:1 body, 3:1 large text, 3:1 for icons and input borders — plus "fix contrast while choosing the palette, not at the end" |
| "Checks if the font is above **11px**" | No such rule — **WCAG has no minimum font size**. Replaced with what the check actually flags (small body copy, over-long lines, justified text and its "rivers") and the real requirement: text must zoom to 200% without breaking. 16px given as a practical floor |
| Touch targets "AA and AAA", no numbers | **24×24 CSS px (AA)**, **44×44 (AAA)** — and 44 is what Apple and Google both recommend, so treat it as the target. Notes that padding can enlarge a target without redrawing the icon |
| Alt text = "text displayed if the image is not loaded", screen readers "another use case" | Purpose first: it is what the image is **called** for someone who cannot see it (without it they hear "image", or `IMG_4821.png`). Broken-image display demoted to a side effect. Adds the harder lesson — describe what the image *does on this page*, with the same photo captioned differently on an About vs a careers page — and covers decorative images |

Also added a closing section tying the guide to #5: these annotations are no longer paperwork,
because developers now implement them in Module 4. The developers are told a clickable thing must
be a `<button>` and that focus must stay visible — but they cannot invent the designer's judgement
about which image is decorative, what the alt text should say, or what order a keyboard user should
move through the page.

`knowledge` (2 → 5), `skills` (2 → 4) and `topicsList` rewritten to match, including the specific
ratios so students can judge a design without the plugin.

## #18 — Stale library and documentation recommendations

Verified before changing anything: `facebookexperimental/Recoil` is **archived** (last push
2025-01-01). Weekly npm downloads at the time of writing — TanStack Query 63.7M, Zustand 50.6M,
Redux 41.0M, Jotai 5.7M, **Recoil 0.48M**. `motion` and `framer-motion` are both published at
13.1.0, so the rename is cosmetic and old imports still work.

### Javascript/React - State Management
- Recoil replaced by **Zustand** as the named example, with an explicit warning that older
  tutorials recommend Recoil and that Meta archived it — plus a pointer to TanStack Query for the
  case where what students actually need is server data, not app state.
- Three inline `reactjs.org` links in the prose → `react.dev`:
  `components-and-props` → `learn/passing-props-to-a-component`,
  `lifting-state-up` → `learn/sharing-state-between-components`,
  `context.html#when-to-use-context` → `learn/passing-data-deeply-with-context`.
- Two resources → `react.dev/reference/react/useContext` and `…/useReducer`.
- Added `react.dev/learn/scaling-up-with-reducer-and-context` — React's own walkthrough of exactly
  this guide's assignment.
- `topicsList`: Recoil → Zustand.

### React - State
- Recoil → Zustand in the prose.
- `topicsList` was the same malformed markup as #10 (stray `<li>`, no `<ul>`); now a proper list.

### React - Components
- `create-react-app.dev/docs/deployment` → `vite.dev/guide/static-deploy.html`, with the note that
  CRA is deprecated and Vite is what new React projects should use.

### SPECIALITY: React - Framer Motion → Motion
- Guide renamed to **`SPECIALITY: React - Motion (6h-8h)`**.
- Description explains the rename so students are not confused when searching finds "Framer Motion"
  everywhere, and notes the old package still works.
- Resource `framer.com/motion` → `motion.dev/docs/react`.
- `topicsList`: "Framer Motion" → "Motion (formerly Framer Motion)".
- Fixed the "Framet Motion" typo in the skills list.

No `reactjs.org`, `create-react-app` or `framer.com/motion` links remain anywhere.

## #17 — The two Module 7 guides

`Further Exploration - The future of Design` and `…of Web Development` describe the same process
but had drifted apart in three places.

| Guide | Before | After |
|---|---|---|
| Future of Web Development | `io.tskoli.dev` (×2 — the submission instruction and the grade line) | `io.vefskoli.is` |
| Future of Design | `Video and Workshop  (65%)` | `Presentation  (65%)` |
| Future of Web Development | "the student creates **a document** that details…" | "a document **like this**" — the Google Doc research-plan template the Design guide already linked |

`io.vefskoli.is` is the production domain — it is `NEXTAUTH_URL`, the Canvas LTI target
(`documentation/CANVAS_QUICK_REFERENCE.md`) and what `seedGroupProjects.mjs` uses. `io.tskoli.dev`
appeared nowhere else in the codebase.

On the 65%: both descriptions say the work "will be presented at a Seminar", and neither process
section ever mentions producing a video or running a workshop — so the Design guide's breakdown was
charging 65% for deliverables it never asked for. Both now read `Presentation`.

The two descriptions are now identical once markup is stripped.

## #16 — Assignment titles (`themeIdea.title`)

| Guide | Before | After |
|---|---|---|
| Design UI - Wireframe | the entire 259-char assignment, duplicated verbatim in the description below it | `Wireframe from your moodboard` |
| SPECIALITY - Continue the MongoDB tutorial | `PostgreSQL with Docker` — leftover from an older version, contradicts the guide | `CRUD with Next.js and MongoDB` |
| SPECIALITY - Prismic CMS | `""` (empty) | `Prismic with Next.js` |
| React - Components | `Choose a reusable componentt to make` | `Choose a reusable component to make` |
| React - State | `Make you component interactive` | `Make your component interactive` |

Scope was errors only. Deliberately left alone as voice, not defects: `Idea for return` (×2),
`ANIMATION IN FIGMA`, `Collaborative work effortness of unity`, `Choose one of the two solutions
suggested here below`. `Nothing` (×2, the Preparation guides) is correct — those have no deliverable.

No assignment title is now empty or over 80 characters.

## #15 — Design Thinking, and empty learning outcomes everywhere

### Design Thinking (12h-16h)

The largest design guide in Module 3 had `skills: []`, `topicsList: ""`, and a single run-on
`knowledge` entry written from the teacher's side ("By the end, students can explain the Double
Diamond, frame a POV/HMW, prototype a happy-path flow, run quick usability tests, and outline an MVP").

- **`knowledge`** — split into 4 discrete items in the "Understand…" form the other guides use.
- **`skills`** — 5 items, from "interview someone without leading them" to "cut a big idea down to
  an MVP you could actually build".
- **`topicsList`** — populated: Double Diamond, diverge/converge, open vs leading questions,
  personas and empathy maps, POV/HMW, Crazy-8s, user flows, usability testing, MVP scoping.
- **`themeIdea`** — *"Evidence from users (2 interviews) ChatGPT can be used as a interviewer"* now
  requires **two interviews with real people**, with ChatGPT explicitly allowed for drafting and
  rehearsing the questions first. Adds: note one thing that surprised you — and if nothing did,
  the questions were probably leading, which is worth writing down too. Also fixed "Analizing" and
  converted the flat text to bold section headings.

### Remaining empty outcome fields

| Guide | Filled |
|---|---|
| Back-end - Workshop | `skills` (research a topic, explain it so peers follow, tell understanding from having read) |
| Getting started - Concepts | `skills` (say which of HTML/CSS/JS is responsible for what; change each and see what happens) |
| Community participation & Networking | `knowledge` + `skills` (both were empty) |
| Further Exploration - Future of Design | `topicsList` |
| Further Exploration - Future of Web Development | `topicsList` |

All 46 guides now have non-empty `knowledge`, `skills` and `topicsList`.

## #13 — CORS in React - Fetch

The guide offered to add students' APIs to a personal Netlify proxy — *"you just need to sign up
for the API and provide me with your API key and I should be able to make it work"*. That meant
API keys changing hands over Slack, and taught "route around CORS" instead of what CORS is.

- **`description`** — new section "One thing that will confuse you: CORS". Explains that the
  browser is the one enforcing it and why (a site you visit should not be able to read your
  webmail using your logged-in session); that the same request works fine from a terminal or a
  server; and that the real fix is therefore asking from something that is not a browser — which
  is what they build in Module 5. Closes with keeping API keys out of public repos.
- **`themeIdea`** — proxy offer removed. Students pick two APIs from the list that work from the
  browser, and park any CORS-blocked favourite until Module 5.
- **`knowledge`** — added "Understand what CORS is, why the browser enforces it, and why a server
  you control is the real answer".
- **`topicsList`** — was the same malformed markup as #10 (bare string + stray `<li>`); now a
  proper list, plus CORS and API-key handling.
- Typos fixed in passing: "fetche", "posibilities", "makre", "comming".

## #12 — Cohort-coupled content (partly done, rest parked)

Applied — neither depends on the timetable:

| Guide | Before | After |
|---|---|---|
| Back end - Next.js with Postgres | "the new App router that they introduced **last year**" | "the App Router, which has been the recommended way to build Next.js apps since 2023" (was three years wrong) |
| TypeScript - Functions | "(currently I have **218 honor points** just for solving Katas)" | "(have a look at my Codewars profile to see what you need to beat)" |

**Parked**, pending the spring 2027 schedule:

- Las Palmas is a **recurring** annual trip (run with two partner schools, so fragile — it depends
  on key teachers staying). Its references stay: they describe the programme, not one cohort.
- "the darkest time of the year" is **accurate** for January in Iceland. Not a defect; leave it.
- Module 5 will not run in January 2027, so "Hello everyone and happy new year! … this first guide
  on a new year" no longer matches when students reach it. Rewording waits on the new schedule.
- **Scheduling conflict to resolve:** `scripts/seedGroupProjects.mjs:371` seeds the Module 5 group
  project for **2027-01-04 → 2027-01-29**, directly over the confirmed early-January trip. The
  script header already flags the spring 2027 dates as provisional. Module 6 is seeded
  2027-02-08 → 2027-04-09.
- `app/LMS/calendar/calendarData.ts` covers only 2026-08-17 → 2026-12-31, so January 2027 is not
  modelled yet at all.
- `Design UX - Las Palmas Facilitator 24h` sits in Module 6 (order 6). Once the schedule is set,
  check it still lands *before* the trip. See also #21 — it duplicates the hidden Module 4
  Design Sprint guide.

## #10 — Malformed `topicsList` fields

The original review claimed `Reading code` (M3 order 6) was mis-sequenced because it lists
Data types, Conditionals and Functions — guides that come later. **That was wrong.** The topics
name what the code a student reads will *contain*, not what they must already know; meeting those
concepts in real code before being taught the syntax is the point of the guide. No resequencing.

What was genuinely broken is markup. Five guides stored `topicsList` as a bare string with no
list tags, so it renders as one run-on line instead of bullets:

| Guide | Before | After |
|---|---|---|
| Reading code | `'Data types\xa0 -Conditionals -Functions\n\xa0- Code reviews'` | `<ul>` with 4 items, under "Things you will run into in the code you read" |
| React - Props | `'props as attributes\nprops as parameters\n'` | `<ul>` with 4 items (added the children prop, typing props with TypeScript) |
| Design UI - Atomic Design | `'Atomic Design\n'` | `<ul>` with 3 items |
| SPECIALITY - Prismic CMS | `'Content Management Systems\n'` | `<ul>` with 3 items |
| Design UI - Design of Fortune! | `'\n'` (effectively empty) | `<ul>` with 4 items |

## #9 — Guide ordering

Guides sort globally by `order` within a module (`getGuides.ts:339`), so `order` is the literal
reading sequence. Every module is now contiguous from 0 with no duplicates and nothing unordered.

| Module | Guide | Before | After | Why |
|---|---|---|---|---|
| 0 | Getting started - Tooling | — | 0 | both unordered; Concepts links back to Tooling |
| 0 | Getting started - Concepts | — | 1 | |
| 1 | HTML & CSS - Introduction | — | 0 | was unordered; MongoDB sorts null first, so it already displayed here |
| 1 | HTML & CSS - Layouting | 0 | 1 | closes the gap at 1 |
| 2 | Community participation & Networking | — | 0 | |
| 4 | Design UI - Smart Components | 5 | 6 | resolves the duplicate order 5 |
| 4 | Design UI - Redesign | 6 | 7 | closes the gap at 7 |
| 5 | Back-end - Workshop | 5 | 4 | closes the gap at 4 |
| 7 | Future of Design | — | 0 | |
| 7 | Future of Web Development | — | 1 | |

Chosen scope was **mechanical only** — every guide keeps its existing display position.
Modules 3 and 6 were left untouched.

Two things deliberately *not* changed, noted for later:

- **Required guides sitting after optional specialities.** In Module 3, `GitHub - Branches and
  Pull Requests` is order 13, after both speciality guides (11, 12). In Module 6,
  `Design UX - Las Palmas Facilitator` is order 6, after the design speciality (5).
- **Discipline grouping is inconsistent between modules.** M3 runs design-then-code, M4 runs
  code-then-design, M6 alternates. Fixing this properly needs the teaching timetable.

## #8 — Base64 image extracted from React - State

The `description` field held a 162 KB WebP inlined as a base64 data URI — 222 KB of the
454 KB collection, more than the other 45 guides combined.

- Extracted to `public/guides/react-state-static-vs-dynamic.webp`, referenced as
  `/guides/react-state-static-vs-dynamic.webp`.
- `description`: **222,413 → 795 characters**. Whole file: **454 KB → 233 KB**.
- Added alt text (it had none).
- No base64 data URIs remain anywhere in the collection.

Left the image itself untouched, pending the planned Atlas object storage for user uploads.
When that lands, these are all plain `/guides/…` paths and move with a find-and-replace.

> The cartoon has **"DYNAMTIC"** misspelled in the artwork, and two signposts are cut off
> mid-word. Kept as-is by decision; worth regenerating whenever the image pipeline changes.

### Legacy `references` arrays dropped

18 rows across 3 guides. These were a 2020-era mirror of `resources`/`classes` (9 of 10 rows in
the Tooling guide were exact duplicates) and included the dead Glitch link. They are not rendered
anywhere student-facing — only in `EditGuideForm`. The three unique W3Schools links from
Getting started - Concepts were promoted to real resources first.
