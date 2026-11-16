---
name: verify
description: Check a change to io.vefskoliv2 by running the app on a throwaway database with seeded people and guides, and clicking through it in a headless browser. Use before saying a change to a page, a form or the exercise runner works.
---

# Verify a change at runtime

`yarn e2e` runs the fixed browser tests. This skill is for the other case: one
specific change that you want to see working, with evidence, before it ships.

Never do this against `.env.local`. Its `MONGODB_CONNECTION` is the `test`
database, which holds copies of live student data, and signing in as a student
writes to it. The throwaway app below cannot reach it.

## 1. Start the throwaway app

```bash
yarn e2e:dev
```

This is `e2e/start-server.cjs --dev`: an in-memory MongoDB on port 27999, the
seed in `e2e/seed.cjs` with its verify extras, and `next dev` on
http://localhost:3999. It is up in a few seconds, reloads as you edit, and
prints the accounts and guide addresses. Stop it with Ctrl+C; the database is
gone when it stops. It uses its own ports and build folder, so it can run next
to `yarn dev` and `yarn e2e`.

Everyone's password is `e2e-pass-123`.

| Account | Role | Use it for |
|---|---|---|
| `teacher@e2e.test` | teacher | grading queue, guide editor, people, view-as |
| `anna@e2e.test`, `bjorn@e2e.test` | student | a student with nothing done yet |
| `legacy@e2e.test` | student | two old numbered attempts at the full exercise, for the merge into one continuous attempt |

| Guide | Address | What it has |
|---|---|---|
| E2E Return Guide | `/guides/6bbbbbbbbbbbbbbbbbbbbbbb` | a project to hand in |
| E2E Quiz Guide | `/guides/6aaaaaaaaaaaaaaaaaaaaaaa` | two quiz questions |
| E2E Full Exercise | `/guides/6ccccccccccccccccccccccc` | six quiz questions over two goals with three served, one short answer, one code task with a hidden test |

Need other data? Add it to `seedVerifyExtras` in `e2e/seed.cjs`, not to the
default seed: the smoke tests count on exactly two guides and three people.

## 2. Drive it

Write a scratch script outside the repo and run it with the project's own
Playwright:

```bash
NODE_PATH=$PWD/node_modules node /path/to/scratch/drive.js
```

```js
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto("http://localhost:3999/signin");
await page.locator('input[name="email"]').fill("anna@e2e.test");
await page.locator('input[name="password"]').fill("e2e-pass-123");
await page.locator('button[type="submit"]').click();
await page.waitForURL(/\/LMS\/dashboard/);
```

Where things are in the exercise runner:

- Open it with the button "Start the exercise" ("Continue the exercise" once
  there is an attempt). It opens in a modal, `[data-testid="modal-wrapper"]`;
  clicking that wrapper closes it.
- The current prompt is `h3[tabindex="-1"]`.
- One button per task, `button[aria-label^="Question N:"]`. The label ends
  with the state: `not attempted`, `correct`, and so on. Clicking one jumps to
  that task.
- Quiz options are `label` elements. Check an answer with the button "Check".
- The short answer input is labelled by its prompt: `getByLabel(prompt)`.
- The code task is a textarea labelled `Your code for <entryPoint>`.
- The line under the prompt reads `Question 1 of 5 · Your score 0/10 · pass
  mark 7/10`.

## 3. Evidence

Take a screenshot at each state you are claiming, and say what you did not
check. Reading the throwaway database afterwards with the `mongodb` driver
(`mongodb://127.0.0.1:27999/e2e`) is fine for confirming what was stored.

## Gotchas

- A new browser context is "another computer": use one to check what is
  stored on the server and what only lives in the browser.
- `innerText` returns some labels in uppercase (CSS `text-transform`); match
  case-insensitively.
- `count()` does not wait. After a click that changes the page, wait for the
  new state (`expect(...).toBeVisible()` or `waitForSelector`) before counting.
- `next dev` and a production build send different Content-Security-Policy
  headers. For anything about the policy, use `yarn e2e`, which builds.
- To stop the app from another shell, kill it by port, not by matching the
  command line: `pkill -f` on the script name also matches your own shell.
