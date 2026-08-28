/**
 * Seed the group projects for Modules 1, 3, 4, 5 and 6 of the 2026–2027
 * school year, based on the project descriptions in docs/:
 *
 *   Module 1 — docs/Project Guidelines.docx        ("Project 1")
 *   Module 3 — docs/Group project - Description.docx
 *   Module 4 — docs/Project 4 - Description.docx
 *   Module 5 — docs/Project 5 - Description.docx
 *   Module 6 — docs/Project 6 - Description.docx
 *
 * Each project carries the presentation rubric from its doc — every rubric row
 * becomes a 0–10 category in the team evaluation. Those rubrics now live in
 * app/constants/moduleRubrics.json, which teachers can also load straight into
 * a project from the rubric editor in the settings tab, so editing that file
 * is enough; this script only attaches them. Autumn dates follow the 2026
 * calendar (app/LMS/calendar/calendarData.ts); the spring 2027 dates for
 * Modules 5 & 6 are provisional.
 *
 * Upserts by title, so it is safe to re-run. Afterwards the collection is
 * backed up to dbBackup/<db>.groupprojects.json.
 *
 * Usage: node scripts/seedGroupProjects.mjs
 */
import "dotenv/config";
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

config({ path: ".env.local" });

const uri = process.env.MONGODB_CONNECTION;
if (!uri) {
  console.error("MONGODB_CONNECTION missing from .env.local");
  process.exit(1);
}

// ── Rubrics ────────────────────────────────────────────────────────────────
// The rubrics themselves live in app/constants/moduleRubrics.json, which the
// app also reads: teachers load these same presets from the rubric editor in
// the project settings, so the file is the single source of truth and this
// script only assigns them to projects.

const RUBRICS = JSON.parse(
  fs.readFileSync(path.join("app", "constants", "moduleRubrics.json"), "utf8")
);

// ── The five projects ──────────────────────────────────────────────────────

const PROJECTS = [
  {
    title: "Module 1 — Group Project: First Website",
    module: 1,
    startDate: "2026-08-24",
    endDate: "2026-08-28",
    presentationDate: "2026-08-28",
    presentationLength: 20,
    description: `## First Website — testing the water

The group must create a website prototype with **Figma, HTML and CSS** (JavaScript optional) and publish it online (suggested platform: **GitHub Pages**). The product's theme can be fictitious or real — use your imagination and networking to find an interesting idea.

**Ideas:** a page for a town festival, an artist portfolio, a redesign of an existing company page, or a page about a common interest of the group.

### What to practice
- **Project management:** team building, product definition (MVP), backlog, sprint planning, status meetings, pair programming, Git.
- **Design:** moodboard, sketches, wireframe (optional), UI design in Figma.
- **Code:** semantic HTML, clean code, comments, responsiveness.
- **Deployment:** static site on GitHub Pages.

### Presentation — 20 min
1. **Introduction (5 min):** group, project, product demo
2. **Design (5 min):** color palette & typography, hierarchy & alignment, UI overall
3. **Programming (5 min):** tech stack, live code
4. **Q&A (5 min)**

Grades come from the industry professionals and instructors. After the presentation each student fills out the peer evaluation, rating themselves and every teammate on contribution and teamwork. That evaluation is **advisory**: your teachers read it when they decide each student's individual grade, but no score in it becomes a grade on its own.`,
    rubric: RUBRICS["1"],
  },
  {
    title: "Module 3 — Group Project: The Fundamentals",
    module: 3,
    startDate: "2026-09-28",
    endDate: "2026-10-16",
    presentationDate: "2026-10-16",
    presentationLength: 30,
    description: `## Interactive Web Application — fundamental technologies

Each group creates an **Interactive Web Application** using fundamental web technologies and the tools provided by the **Design Thinking** ideology. Agile methodologies (user stories, backlog, status meetings, sprints) organize the group work.

### Deliverables
- **Design hand-off:** user research, moodboard, lo-fi prototype (sketches or wireframes), user testing, UI style guide (colors, typography, grids, components, iconography) and final UI design.
- **Code:** HTML, CSS/Tailwind and pure (vanilla) **TypeScript** — functions, arrays, objects and loops, **no JS frameworks or libraries**. Delivered as a Git repository.
- The final product must be **available online** for the general public.

**Theme ideas:** a focus/task tracker, a color-scheme generator, a music-making app — or your own idea (talk to teachers first).

**Groups of 3–4 students.**

### Presentation — 30 min
1. **Introduction (5 min):** group intro, trying it out (QR code!), product demo, work organization, task→feature, tools/tech stack
2. **Design (7 min):** design thinking tools, user research, discoveries, user testing, moodboard, wireframe, style guide, hi-fi prototype
3. **Programming (10 min):** file structure, variable names, documentation, live code, GitHub (branches, commits, code review)
4. **Q&A (8 min)**

Grade weight: guest industry professionals and instructors **80%**, audience **20%**. After the presentation each student fills out the peer evaluation, rating themselves and every teammate on contribution and teamwork. That evaluation is **advisory**: your teachers read it when they decide each student's individual grade, but no score in it becomes a grade on its own. Finish with a retro meeting.`,
    rubric: RUBRICS["3"],
  },
  {
    title: "Module 4 — Group Project: Connecting to the World",
    module: 4,
    startDate: "2026-11-06",
    endDate: "2026-12-04",
    presentationDate: "2026-12-04",
    presentationLength: 30,
    description: `## Connecting to the World — React & APIs

Each group creates an application which **connects to other applications using APIs**, built with **React and TypeScript**, to amplify the uses and potential of their own product. This is the longest group project so far — React helps organize and split the code so everyone can work on their own piece.

### Project requirements
- **Design Sprint** based on the double diamond: find a problem, interview potential users, analyze, brainstorm, test and finalize from user feedback.
- **UI design** with a **mobile-first** lo-fi prototype, a well-connected style guide and a fully polished hi-fi prototype. Emphasize **accessibility**.
- **Tech:** React, TypeScript and a styling library (styled-components or Tailwind). Other JS libraries encouraged. **Use of APIs is mandatory.**
- **The built product must be accessible, not only the design.** The whole main flow has to work with the keyboard alone: everything reachable by Tab, focus always visible, icon-only buttons labelled. Be ready to demo this live.
- The final product must be **available online** for the general public.

**Theme ideas:** better feedback on io.vefskoli.is, a Hall of Fame, making more of under-used public APIs, or the UN Sustainable Development Goals.

**Groups of 4–5 students.**

### Presentation — 30 min
1. **Introduction (5 min):** trying it out, product demo, work organization, task→feature, tools/tech stack
2. **Design (7 min):** design sprint tools, user research, discoveries, user testing, mobile first, accessible design, style guide, hi-fi prototype
3. **Programming (10 min):** TypeScript & API, accessibility walkthrough (keyboard only, no mouse), naming convention, documentation, live code, GitHub (branches, commits, code review)
4. **Q&A (8 min)**

Grade weight: guest industry professionals and instructors **80%**, audience **20%**. After the presentation each student fills out the peer evaluation, rating themselves and every teammate on contribution and teamwork. That evaluation is **advisory**: your teachers read it when they decide each student's individual grade, but no score in it becomes a grade on its own. A common retro meeting is held after the presentations.`,
    rubric: RUBRICS["4"],
  },
  {
    title: "Module 5 — Group Project: Back End and Infrastructure",
    module: 5,
    startDate: "2027-01-04",
    endDate: "2027-01-29",
    presentationDate: "2027-01-29",
    presentationLength: 30,
    description: `## Back End and Infrastructure — contribute to open source

*(Spring 2027 — dates are provisional until the spring calendar is confirmed.)*

The group must **contribute to an open source project** and add features and/or fix bugs in it. The added code must have a **back end** that connects to an external service (a database or an API). Start with **mob programming** to get everyone on the same page, then split into pairs and individual branches.

### Requirements
- Any programming language, framework, libraries, database and hosting the group wishes.
- At least **3 endpoints** (GET/POST/PUT/DELETE each count separately) performing separate tasks.
- **CRUD** operations with **error handling** and correct **response status codes** (200, 404, …).
- An **API key or authentication** system to prevent unauthorized access.
- **Defense mechanisms** against common attacks (libraries allowed).
- The new API routes must be **well documented**.

*Nice to have:* front-end demo, access levels, caching layer, analytics, unit tests.

**Theme ideas:** contribute to the io.vefskoli.is open source project (home page, gallery, resources, people page, calendar page, bug fixes…) or any other open source project.

**One group of all students.** The final product is a **pull request** to the chosen project.

### Presentation — 30 min
1. **Introduction (5 min):** project intro, product demo, all endpoints working, error handling
2. **Programming (15 min):** contribution scope, live coding, interactive demonstration (audience tests the API)
3. **Q&A (10 min)**

Grade weight: guest industry professionals and instructors **80%**, audience **20%**. After the presentation each student fills out the peer evaluation, rating themselves and every teammate on contribution and teamwork. That evaluation is **advisory**: your teachers read it when they decide each student's individual grade, but no score in it becomes a grade on its own.`,
    rubric: RUBRICS["5"],
  },
  {
    title: "Module 6 — Group Project: Growing Complexity",
    module: 6,
    startDate: "2027-02-08",
    endDate: "2027-04-09",
    presentationDate: "2027-04-09",
    presentationLength: 40,
    description: `## Growing Complexity — a real product for real users

*(Spring 2027 — dates are provisional until the spring calendar is confirmed.)*

Each group creates a **complex web application** ready to be used in the real world by real users. The project **must include** at least 9 of the complexity aspects below — they modulate the final grade:

- Agile methodologies · Design Thinking (UX) · User testing (UX) · Complete UI design
- Authentication / user accounts · User administration / data persistence (database or headless CMS)
- Static generation or SSR · State management · Deployment (public link) · API connections

*Even better:* automated tests, file uploading, security measures, multiplatform access, sharing capabilities, SEO, GDPR-awareness, AI integration — or your own technical challenge (after consulting the instructors).

### Requirements
- Agile methods (backlog, status meetings, pair programming).
- Lo-fi prototype, style guide and hi-fi prototype; Design Thinking for the application flow.
- **Free choice of technology** — the feature list above is the sole guideline.
- The final product must be **online for the general public** to create an account and use.

**Theme ideas:** a better io LMS, a "Shopify" for creatives, a website builder for artists, a delivery platform, a job listing site, a mindfulness platform…

**Groups of 4 students.**

### Presentation — 40 min
First to teachers for feedback and grades, then fine-tuned for industry professionals.
1. **Introduction (10 min):** group & project intro, interactive demo (audience tests the site)
2. **Design (10 min):** moodboard/sketches/wireframes/style guide, UI prototype, UX approach & user tests
3. **Programming (10 min):** technology, live coding
4. **Q&A (10 min)**

Grade weight: guest industry professionals and instructors **80%**, audience **20%**. After the presentation each student fills out the peer evaluation, rating themselves and every teammate on contribution and teamwork. That evaluation is **advisory**: your teachers read it when they decide each student's individual grade, but no score in it becomes a grade on its own.`,
    rubric: RUBRICS["6"],
  },
];

// ── Seed ───────────────────────────────────────────────────────────────────

const projectSchema = new mongoose.Schema({}, { strict: false });
const GroupProject = mongoose.model("GroupProject", projectSchema, "groupprojects");
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");

await mongoose.connect(uri);

const teacher = await User.findOne({ role: "teacher" }, { _id: 1, name: 1 }).lean();
if (!teacher) {
  console.error("No teacher user found — cannot set createdBy");
  await mongoose.disconnect();
  process.exit(1);
}
console.log(`Using teacher ${teacher.name ?? teacher._id} as createdBy`);

for (const project of PROJECTS) {
  const result = await GroupProject.updateOne(
    { title: project.title },
    {
      $set: {
        description: project.description,
        module: project.module,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        presentationDate: new Date(project.presentationDate),
        presentationLength: project.presentationLength,
        rubric: project.rubric,
      },
      $setOnInsert: {
        status: "formation",
        presentationSlots: [],
        peerEvalOpen: false,
        teamEvalOpen: false,
        createdBy: teacher._id,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log(
    `${result.upsertedCount ? "created" : "updated"}  ${project.title} (${project.rubric.length} rubric rows)`
  );
}

// ── Backup ─────────────────────────────────────────────────────────────────

const dbName = mongoose.connection.db.databaseName;
const all = await GroupProject.find({}).lean();
const backupPath = path.join("dbBackup", `${dbName}.groupprojects.json`);
fs.writeFileSync(backupPath, JSON.stringify(all, null, 2));
console.log(`Backed up ${all.length} group projects to ${backupPath}`);

await mongoose.disconnect();
