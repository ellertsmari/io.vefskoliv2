# Writing a group project brief

Every group project brief is one TypeScript file in
[`app/projects/briefs/`](../app/projects/briefs/), one per module. It holds the
words and the look. The dates, rubric and grade weights come from that module's
project in the database, so the timeline, the presentation agenda and the
grading lab always match what is actually graded.

The brief is shown:

- in the LMS, on the module's project (the **Project brief** step, and the **Brief** tab for teachers);
- at `/projects/<slug>`, publicly, once the project is past team formation. Teachers can open it earlier.

There is no editor. To change a brief, edit the file (or ask an LLM to), open a
pull request and review it like any other change.

## The quick way: ask an LLM

Paste this into Claude (or any capable LLM). Put the old description, notes or
a Google Doc in the gap, and attach the existing brief file and
`app/constants/projectBrief.ts` so it can see the format:

```text
You are writing a group project brief for Vefskólinn, a web development
programme at Tækniskólinn in Reykjavík. Write it in English.

Output one TypeScript file in exactly the format of the attached example: it
exports a `ProjectBrief` (type in app/constants/projectBrief.ts). Keep the
same module number and slug unless I say otherwise.

Rules:
- Use only facts from my notes below. Do not invent requirements, dates,
  grade weights or team sizes. Where a field needs content my notes do not
  give (phases, goals, FAQ), write the obvious, modest version and list
  what you added at the end, after the code, so I can check it.
- Dates and grading are NOT in the file — they come from the database.
- Keep sections short: a mission statement of one or two sentences,
  at most 4 paragraphs, 3–4 goals, up to 5 requirement tabs of at most 8
  items, up to 8 ideas, 3–5 phases, 3–8 FAQ questions.
- Inline formatting only: **bold**, *italic*, `code`, [link](https://…).
- Icons are Iconify names, e.g. "mdi:api" (https://icon-sets.iconify.design/mdi/).
- Presentation parts list rubric keys in `criteria`. Use these keys:
  <paste the rubric keys and titles from the project's Settings tab>
- Pick a theme that fits the project: eight #rrggbb colours with readable
  contrast (text on background, heroText on heroBackground, accentText on
  accent) and two Google Fonts families.

My notes:
<paste here>
```

Then save the file, add it to [`app/projects/briefs/index.ts`](../app/projects/briefs/index.ts)
if it is new, and check it:

```bash
JEST_CONTENT=1 npx jest projectBriefs   # valid colours, fonts, slugs; sections not too long
npm run typecheck
npm run dev                             # then open http://localhost:3000/projects/<slug>
```

## What goes where

| Field | Becomes |
| --- | --- |
| `title`, `tagline`, `teamSize`, `coverImage` | The cover. Weeks, presentation length and the number of criteria are added from the project. |
| `mission` | 01 — a big statement, a few paragraphs, an optional `aside` (a story or fact that deepens the why), optional `media` (YouTube id or image), and 3–4 `goals` cards. |
| `requirements` | 02 — one tab per area. `bonus` adds a "nice to have" card, `handIn` a checklist, and `pickList` a "pick at least N" checklist with a counter. |
| `ideas`, `ideasNote` | 03 — idea cards. |
| `phases` | 04 — the timeline. Phases share the time from kick-off to presentation day by `weight`, so it still fits when the dates move. A wrap-up is added after presentation day. |
| `presentation`, `presentationNote` | 05 — the agenda, playable at one second per minute. `criteria` are rubric keys and show as the criteria scored in that part. |
| *(from the database)* | 06 — the grading lab: the project's real rubric, panel/audience weights and the peer-rating formula. |
| `faq` | 07 — questions, also published as FAQ structured data for search engines. |

## Rubric keys

`criteria` must use the keys of the project's rubric (Settings tab → Rubric).
A key that does not match still shows, just as plain text instead of the
criterion's title and colour, so check the presentation section after a
rubric change.
