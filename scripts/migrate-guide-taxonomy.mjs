/**
 * One-off backfill: populate the canonical taxonomy axes (`discipline`,
 * `isSpecialty`) on every guide from the legacy `category` string.
 *
 * This is OPTIONAL — the app reads taxonomy through utils/guideTaxonomy, which
 * falls back to deriving these from `category` when the fields are absent. Run it
 * to make the new fields explicit in the DB (nicer for queries/consistency).
 *
 * Usage:
 *   node scripts/migrate-guide-taxonomy.mjs           # apply
 *   node scripts/migrate-guide-taxonomy.mjs --dry-run # report only
 *
 * Requires MONGODB_CONNECTION in .env.local (loaded below).
 */
import "dotenv/config";
import { config } from "dotenv";
import mongoose from "mongoose";

// Prefer .env.local (Next's convention) if present.
config({ path: ".env.local" });

const DRY_RUN = process.argv.includes("--dry-run");

const categoryToAxes = (category) => {
  switch (category) {
    case "design":
      return { discipline: "design", isSpecialty: false };
    case "codeSpeciality":
      return { discipline: "code", isSpecialty: true };
    case "designSpeciality":
      return { discipline: "design", isSpecialty: true };
    case "code":
    default:
      return { discipline: "code", isSpecialty: false };
  }
};

const run = async () => {
  const uri = process.env.MONGODB_CONNECTION;
  if (!uri) {
    console.error("MONGODB_CONNECTION is not set (check .env.local).");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const guides = mongoose.connection.db.collection("guides");

  const cursor = guides.find(
    {},
    { projection: { category: 1, discipline: 1, isSpecialty: 1 } }
  );

  let scanned = 0;
  let updated = 0;

  for await (const guide of cursor) {
    scanned++;
    const axes = categoryToAxes(guide.category);
    const needsDiscipline = guide.discipline !== axes.discipline;
    const needsSpecialty = guide.isSpecialty !== axes.isSpecialty;
    if (!needsDiscipline && !needsSpecialty) continue;

    updated++;
    if (DRY_RUN) {
      console.log(
        `would update ${guide._id}: category=${guide.category} -> discipline=${axes.discipline}, isSpecialty=${axes.isSpecialty}`
      );
    } else {
      await guides.updateOne(
        { _id: guide._id },
        { $set: { discipline: axes.discipline, isSpecialty: axes.isSpecialty } }
      );
    }
  }

  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}scanned ${scanned} guides, ${updated} ${
      DRY_RUN ? "would be " : ""
    }updated.`
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
