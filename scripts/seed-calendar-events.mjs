/**
 * One-off seed: import the static autumn-semester plan (previously hard-coded
 * in app/LMS/calendar/calendarData.ts) into the calendarevents collection so
 * teachers can edit it through the UI.
 *
 * Category mapping from the legacy dataset:
 *   milestone -> guide   (the "Key date" category was renamed)
 *   deadline  -> guide   (submission deadlines are guide dates; the deadline
 *                         category was replaced by "Module 2 event", which has
 *                         no equivalent in the legacy data)
 * Legacy single `date` becomes startDate = endDate; a legacy `time` becomes
 * startTime (no end times existed in the static data).
 *
 * Seeded events have owner: null (school events — editable by teachers only).
 * Idempotent-ish: refuses to run when the collection already has events,
 * unless --force is passed.
 *
 * Usage:
 *   node scripts/seed-calendar-events.mjs            # apply
 *   node scripts/seed-calendar-events.mjs --dry-run  # report only
 *   node scripts/seed-calendar-events.mjs --force    # seed even if non-empty
 *
 * Requires MONGODB_CONNECTION in .env.local (loaded below).
 */
import "dotenv/config";
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const LEGACY_EVENTS = [
  // ── Week 34 · Intro / Module 1 ──────────────────────────────────────────
  {
    id: "first-day",
    date: "2026-08-17",
    title: "First day — start of Spönn 1",
    category: "milestone",
    time: "10:00",
    description:
      "Nýnemadagur. Welcome and introduction to Vefskólinn. Module 1 guides begin.",
  },
  {
    id: "w34-grad-prev",
    date: "2026-08-18",
    title: "Graduation of previous students",
    category: "milestone",
    time: "10:00",
  },
  {
    id: "w34-html-css",
    date: "2026-08-19",
    title: "Introduction to HTML & CSS",
    category: "lecture",
    time: "10:00",
    description: "Module 1 guides.",
  },
  {
    id: "w34-figma",
    date: "2026-08-20",
    title: "Introduction to Figma",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w34-checkin",
    date: "2026-08-21",
    title: "Friday check-in",
    category: "groupwork",
  },

  // ── Week 35 · Module 1 group project ────────────────────────────────────
  {
    id: "w35-groupproject",
    date: "2026-08-24",
    title: "M1 group project — kickoff",
    category: "groupwork",
    time: "10:00",
    description: "Introduction to the Module 1 group project.",
  },
  {
    id: "w35-presentation",
    date: "2026-08-28",
    title: "M1 group project presentation",
    category: "groupwork",
  },

  // ── Week 36 · Module 3 — Design thinking ────────────────────────────────
  {
    id: "w36-intro",
    date: "2026-08-31",
    title: "Introduction to Module 3 & Module 2",
    category: "milestone",
    time: "09:30",
  },
  {
    id: "w36-moodboard",
    date: "2026-09-03",
    title: "M3 — Moodboards & Wireframes",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w36-wireframe",
    date: "2026-09-04",
    title: "M3 — Wireframe",
    category: "lecture",
  },

  // ── Week 37 · Module 3 — Style guide / prototype / tooling ──────────────
  {
    id: "w37-styleguide",
    date: "2026-09-07",
    title: "M3 — Style Guide",
    category: "lecture",
  },
  {
    id: "w37-hifi",
    date: "2026-09-09",
    title: "M3 — Hi-fi Prototype",
    category: "lecture",
  },
  {
    id: "w37-tailwind",
    date: "2026-09-10",
    title: "M3 — CSS frameworks / Tailwind",
    category: "lecture",
    time: "11:00",
  },

  // ── Week 38 · Module 3 — Reading code & TypeScript ──────────────────────
  {
    id: "w38-readingcode",
    date: "2026-09-14",
    title: "M3 — Reading Code",
    category: "lecture",
    time: "10:20",
  },
  {
    id: "w38-datatypes",
    date: "2026-09-15",
    title: "M3 — TS Data Types",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w38-conditionals",
    date: "2026-09-16",
    title: "M3 — TS Conditionals",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w38-retro",
    date: "2026-09-16",
    title: "Retro meeting",
    category: "groupwork",
    time: "10:00",
  },
  {
    id: "w38-loops",
    date: "2026-09-18",
    title: "M3 — TS Loops & Iterators",
    category: "lecture",
    time: "10:00",
  },

  // ── Week 39 · Module 3 — Functions / Speciality / GitHub ────────────────
  {
    id: "w39-functions",
    date: "2026-09-21",
    title: "M3 — TS Functions",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w39-speciality",
    date: "2026-09-22",
    title: "Speciality guides",
    category: "lecture",
  },
  {
    id: "w39-github",
    date: "2026-09-24",
    title: "GitHub guide",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w39-events",
    date: "2026-09-25",
    title: "Events in TypeScript + Friday check-in",
    category: "lecture",
  },

  // ── Week 40 · Module 3 group work ───────────────────────────────────────
  {
    id: "w40-groupwork",
    date: "2026-09-28",
    title: "M3 group work — Design thinking",
    category: "groupwork",
    time: "10:00",
    description: "Anna Signý helping with design thinking, 10:00–12:00.",
  },
  {
    id: "w40-groupwork2",
    date: "2026-09-30",
    title: "M3 group work — Design thinking",
    category: "groupwork",
    time: "10:00",
  },
  {
    id: "w40-groupwork3",
    date: "2026-10-02",
    title: "M3 group work — Design thinking",
    category: "groupwork",
    time: "10:00",
  },

  // ── Week 41 · Module 3 group work ───────────────────────────────────────
  {
    id: "w41-groupwork",
    date: "2026-10-05",
    title: "M3 group work",
    category: "groupwork",
  },

  // ── Week 42 · Module 3 group work + presentations ───────────────────────
  {
    id: "w42-groupwork",
    date: "2026-10-12",
    title: "M3 group work",
    category: "groupwork",
  },
  {
    id: "w42-teacherpres",
    date: "2026-10-14",
    title: "Teacher presentation",
    category: "lecture",
  },
  {
    id: "w42-finalpres",
    date: "2026-10-16",
    title: "M3 — Final presentations",
    category: "groupwork",
    time: "10:00",
  },
  {
    id: "last-day-s1",
    date: "2026-10-16",
    title: "Last day of Spönn 1",
    category: "milestone",
    description: "Lokadagur spannar. End of the first span.",
  },

  // ── Week 43 · Module 4 — Spönn 2 begins ─────────────────────────────────
  {
    id: "first-day-s2",
    date: "2026-10-19",
    title: "Start of Spönn 2",
    category: "milestone",
    time: "09:30",
    description:
      "Introduction to Module 4 and Module 3 retro meeting. Module 4 guides begin.",
  },
  {
    id: "w43-react",
    date: "2026-10-19",
    title: "M4 — Intro to React & Components",
    category: "lecture",
    time: "13:00",
  },
  {
    id: "w43-props",
    date: "2026-10-20",
    title: "M4 — Props in React",
    category: "lecture",
    time: "13:00",
  },
  {
    id: "w43-state",
    date: "2026-10-21",
    title: "M4 — State in React",
    category: "lecture",
    time: "13:00",
  },
  {
    id: "w43-fetch",
    date: "2026-10-23",
    title: "M4 — Fetch in React",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w43-sprint-pres",
    date: "2026-10-25",
    title: "Sprint presentation (Kynning á sprettinum)",
    category: "deadline",
  },

  // ── Week 44 · Module 4 — Fetch / Styling / Figma ────────────────────────
  {
    id: "w44-fetch",
    date: "2026-10-26",
    title: "M4 — Fetch",
    category: "lecture",
  },
  {
    id: "w44-styling",
    date: "2026-10-27",
    title: "M4 — Styling in React",
    category: "lecture",
    time: "13:00",
  },
  {
    id: "w44-figma",
    date: "2026-10-29",
    title: "M4 — Components & Properties in Figma",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w44-figma2",
    date: "2026-10-30",
    title: "M4 — Components & Properties in Figma (pt. 2)",
    category: "lecture",
    time: "10:00",
  },

  // ── Week 45 · Module 4 — Accessibility / Redesign / Design sprint ───────
  {
    id: "w45-a11y",
    date: "2026-11-02",
    title: "M4 — Accessible UI",
    category: "lecture",
    time: "10:00",
    description: "Accessibility in Figma.",
  },
  {
    id: "w45-redesign",
    date: "2026-11-03",
    title: "M4 — UI Redesign",
    category: "lecture",
    time: "13:00",
  },
  {
    id: "w45-designsprint",
    date: "2026-11-05",
    title: "M4 — Design Sprint",
    category: "lecture",
    time: "10:00",
  },
  {
    id: "w45-groupintro",
    date: "2026-11-06",
    title: "Group work intro + Friday check-in",
    category: "groupwork",
    time: "11:00",
  },

  // ── Week 46 · Module 4 group work — Design sprint week ──────────────────
  {
    id: "w46-sprint",
    date: "2026-11-09",
    title: "M4 group work — Design Sprint week",
    category: "groupwork",
  },

  // ── Week 47 · Module 4 group work ───────────────────────────────────────
  {
    id: "w47-design",
    date: "2026-11-16",
    title: "Finalize design",
    category: "groupwork",
  },
  {
    id: "w47-coding",
    date: "2026-11-18",
    title: "Start coding",
    category: "groupwork",
  },
  {
    id: "w47-status",
    date: "2026-11-22",
    title: "Status interview 1 (Stöðuviðtal 1)",
    category: "deadline",
  },

  // ── Week 48 · Module 4 group work — Coding ──────────────────────────────
  {
    id: "w48-coding",
    date: "2026-11-23",
    title: "M4 group work — Coding",
    category: "groupwork",
  },

  // ── Week 49 · Module 4 group work — Finalize & present ──────────────────
  {
    id: "w49-slides",
    date: "2026-11-30",
    title: "Finalize & slides",
    category: "groupwork",
  },
  {
    id: "w49-teacherpres",
    date: "2026-12-01",
    title: "Teacher presentation",
    category: "lecture",
    time: "13:00",
  },
  {
    id: "w49-feedback",
    date: "2026-12-02",
    title: "Finalize per teacher feedback",
    category: "groupwork",
  },
  {
    id: "w49-finalpres",
    date: "2026-12-04",
    title: "M4 — Final presentation",
    category: "groupwork",
  },
  {
    id: "w49-designfinal",
    date: "2026-12-06",
    title: "Design Final",
    category: "deadline",
  },

  // ── Week 50 · Wrap-up ───────────────────────────────────────────────────
  {
    id: "w50-interviews",
    date: "2026-12-07",
    title: "Final interviews — feedback on guides & reviews",
    category: "groupwork",
  },
  {
    id: "w50-mvp",
    date: "2026-12-13",
    title: "MVP submission (MVP skil)",
    category: "deadline",
  },

  // ── Weeks 51–52 · Holiday & graduation ──────────────────────────────────
  {
    id: "w51-holiday",
    date: "2026-12-14",
    title: "Holiday — independent work",
    category: "holiday",
  },
  {
    id: "graduation",
    date: "2026-12-21",
    title: "Graduation (Brautskráning)",
    category: "milestone",
  },
  {
    id: "christmas-break",
    date: "2026-12-22",
    title: "Christmas break begins (Jólafrí)",
    category: "holiday",
  },
];

const CATEGORY_MAP = {
  milestone: "guide",
  deadline: "guide",
  lecture: "lecture",
  groupwork: "groupwork",
  holiday: "holiday",
};

const toDoc = (event) => ({
  title: event.title,
  description: event.description,
  category: CATEGORY_MAP[event.category] ?? "guide",
  startDate: event.date,
  endDate: event.date,
  startTime: event.time,
  endTime: undefined,
  owner: null,
  visibility: "everyone",
  sharedWith: [],
});

const main = async () => {
  const uri = process.env.MONGODB_CONNECTION;
  if (!uri) {
    console.error("MONGODB_CONNECTION is not set (.env.local)");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection("calendarevents");

  const existing = await collection.countDocuments();
  if (existing > 0 && !FORCE) {
    console.error(
      `calendarevents already has ${existing} document(s); pass --force to seed anyway.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const docs = LEGACY_EVENTS.map(toDoc);
  console.log(`Prepared ${docs.length} events from the legacy semester plan.`);
  for (const doc of docs.slice(0, 3)) {
    console.log("  e.g.", doc.startDate, "-", doc.category, "-", doc.title);
  }

  if (DRY_RUN) {
    console.log("Dry run — nothing written.");
  } else {
    const now = new Date();
    await collection.insertMany(
      docs.map((d) => ({ ...d, createdAt: now, updatedAt: now }))
    );
    console.log(`Inserted ${docs.length} events.`);
  }

  await mongoose.disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
