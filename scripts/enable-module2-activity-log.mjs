/**
 * Run after deploying activity-log support. Dry run by default:
 *   node scripts/enable-module2-activity-log.mjs
 *   node scripts/enable-module2-activity-log.mjs --apply
 *
 * Targets exactly one Module 2 community/networking guide, backs it up, and
 * changes its completion type/instructions. No student records are modified.
 * Semester dates are configured by the teacher in the new activity log.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local", quiet: true });
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply")) throw new Error("Usage: node scripts/enable-module2-activity-log.mjs [--apply]");
const apply = args.includes("--apply");

const description = `Take part in activities that strengthen your participation in the web industry. This is individual work.

## Record your participation

Add each activity to the log with its name, date, time spent, location (or Online), a short description of what you did and learned, and one or two images. You can also add supporting links, such as contributions, certificates or event pages.

For an ongoing activity, edit the existing activity and add more dates. Your teacher reviews each activity and may ask you to clarify the evidence.

## Required hours

- Complete 30 credited hours overall: 15 for Autumn and 15 for Spring.
- Extra approved Autumn hours carry forward to Spring. For example, 20 Autumn hours plus 10 Spring hours meets both targets.
- Spring hours do not make up an Autumn shortfall.
- Each activity can contribute at most 10 credited hours, even when it spans several dates. You can record more time; your log keeps the full amount.
- Use the reporting-year dates shown in the log. Credit follows the activity date, not the date you submit it.

## Activity ideas

- Create or contribute to open-source projects.
- Answer web-development questions in online communities.
- Help organise a web-related event.
- Organise or attend web-related events.

Your log replaces the spreadsheet/report link. Keep adding activities throughout the year and check your semester progress here.`;

try {
  if (!process.env.MONGODB_CONNECTION) throw new Error("MONGODB_CONNECTION is missing.");
  await mongoose.connect(process.env.MONGODB_CONNECTION, { autoIndex: false, serverSelectionTimeoutMS: 10000 });
  const guides = mongoose.connection.db.collection("guides");
  const candidates = await guides.find({ "module.title": /^2\s*-/, title: /community.*networking/i }).toArray();
  if (candidates.length !== 1) throw new Error(`Expected one Module 2 community/networking guide; found ${candidates.length}. No changes made.`);
  const guide = candidates[0];
  if (guide.submissionType === "activityLog") {
    console.log("Module 2 already uses the activity log. Existing instructions left unchanged.");
  } else {
    const changes = { submissionType: "activityLog", gradingMode: "peerReview", description, themeIdea: { title: "Activity log", description: "Record your community participation here, with dates, hours, a short reflection and one or two images. Meet the two semester targets using the carry-forward rules above." }, updatedAt: new Date() };
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry run", guideId: String(guide._id), title: guide.title, changes }, null, 2));
    if (apply) {
      await mkdir("dbBackup", { recursive: true });
      const backup = `dbBackup/module2-before-activity-log-${Date.now()}.json`;
      await writeFile(backup, JSON.stringify(guide, null, 2), { flag: "wx", mode: 0o600 });
      await mongoose.connection.db.collection("activityentries").createIndex({ cycle: 1, owner: 1, normalizedName: 1 }, { unique: true });
      await mongoose.connection.db.collection("activityentries").createIndex({ guide: 1, cycle: 1, owner: 1 });
      await mongoose.connection.db.collection("activitycycles").createIndex({ guide: 1, label: 1 }, { unique: true });
      const updated = await guides.updateOne({ _id: guide._id, updatedAt: guide.updatedAt, submissionType: { $ne: "activityLog" } }, { $set: changes, $unset: { exercise: "" } });
      if (updated.modifiedCount !== 1) throw new Error("The guide changed during migration. Reload and review before retrying.");
      console.log(`Enabled. Backup: ${backup}. Open /guides/${guide._id} as a teacher to set semester dates.`);
    }
  }
} catch (error) {
  // Do not print connection strings or credential-bearing driver errors.
  console.error(error instanceof Error && !/mongodb|querySrv|ECONN|ENOTFOUND/i.test(error.message) ? error.message : "Database connection failed. Check configuration and network access.");
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
