/**
 * @jest-environment node
 *
 * Every file that compiles a mongoose model must import "models/autoConnect"
 * before anything else.
 *
 * That import registers the plugin that makes each query connect to the
 * database by itself (see app/models/autoConnect.ts). Mongoose copies a
 * schema's hooks when the model is compiled, so a model compiled without the
 * plugin never connects on its own, and the failure only shows on a cold
 * serverless instance: in development a page render has always connected
 * first.
 */
import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "app");
const AUTO_CONNECT = path.join(APP_DIR, "models", "autoConnect.ts");

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });

/** `model(…)`, `model<T>(…)` and `mongoose.model…`, but not `models.X`. */
const COMPILES_MODEL = /(^|[^\w.])(mongoose\.)?model\s*(<[^>(]*>)?\s*\(/m;

const firstImport = (source: string) =>
  source.split("\n").find((line) => /^\s*import\b/.test(line)) ?? "";

describe("model files register the auto-connect plugin first", () => {
  const modelFiles = walk(APP_DIR).filter(
    (file) =>
      file !== AUTO_CONNECT && COMPILES_MODEL.test(fs.readFileSync(file, "utf-8"))
  );

  it("finds the model files, so a broken matcher cannot pass silently", () => {
    expect(modelFiles.length).toBeGreaterThan(20);
  });

  it("each one imports models/autoConnect before any other import", () => {
    const offenders = modelFiles
      .filter(
        (file) =>
          !/^\s*import\s+["']models\/autoConnect["']/.test(
            firstImport(fs.readFileSync(file, "utf-8"))
          )
      )
      .map((file) => path.relative(process.cwd(), file));
    expect(offenders).toEqual([]);
  });
});
