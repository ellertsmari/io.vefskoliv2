/**
 * One-off migration for the external-judge feature: the teamevaluations
 * unique index {project,team,evaluator,category} must become PARTIAL
 * (evaluator exists) so judge evaluations — which have a `judge` field
 * instead of `evaluator` — don't collide as evaluator:null.
 *
 * MongoDB cannot alter index options in place and mongoose's autoIndex
 * cannot replace a same-key index with different options, so this script
 * drops the old full index (when present) and creates the two partial
 * unique indexes explicitly. Idempotent — safe to re-run.
 *
 * Usage: node scripts/migrateTeamEvaluationIndexes.mjs
 */
import "dotenv/config";
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

const uri = process.env.MONGODB_CONNECTION;
if (!uri) {
  console.error("MONGODB_CONNECTION missing from .env.local");
  process.exit(1);
}

await mongoose.connect(uri);
const collection = mongoose.connection.db.collection("teamevaluations");

const indexes = await collection.indexes();
const oldIndex = indexes.find(
  (index) =>
    index.name === "project_1_team_1_evaluator_1_category_1" &&
    !index.partialFilterExpression
);
if (oldIndex) {
  await collection.dropIndex(oldIndex.name);
  console.log(`dropped legacy full index ${oldIndex.name}`);
} else {
  console.log("legacy full index not present");
}

await collection.createIndex(
  { project: 1, team: 1, evaluator: 1, category: 1 },
  { unique: true, partialFilterExpression: { evaluator: { $exists: true } } }
);
await collection.createIndex(
  { project: 1, team: 1, judge: 1, category: 1 },
  { unique: true, partialFilterExpression: { judge: { $exists: true } } }
);
console.log("partial unique indexes in place");

await mongoose.disconnect();
