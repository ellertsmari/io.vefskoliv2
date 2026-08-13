/**
 * Check that the built output actually ships the files the code reads at
 * runtime. Run after `next build`.
 *
 * Vercel's file tracing follows imports. It does not know about files opened
 * later by name, so a package can ship its JavaScript and none of its data.
 * That is exactly what happened: the TypeScript compiler arrived without its
 * standard library, `Array` was undefined, `Person[]` became `{}`, and correct
 * student submissions were rejected with errors about `{}` having no `length`.
 *
 * The fix — outputFileTracingIncludes in next.config.mjs — fails SILENTLY when
 * its key does not match (a literal "/guides/[id]" matches nothing; it has to
 * be a glob). Nothing warns you. Hence this check.
 *
 * Usage: node scripts/verifyBuildTrace.mjs
 */
import fs from "node:fs";
import path from "node:path";

const TRACE = ".next/server/app/guides/[id]/page.js.nft.json";

/** What the guides route must carry, and why. */
const REQUIREMENTS = [
  {
    label: "TypeScript standard library (lib.*.d.ts)",
    match: (f) => f.includes("typescript/lib/lib.") && f.endsWith(".d.ts"),
    atLeast: 20,
    because:
      "the exercise grader type-checks student code; without these every global type is missing",
  },
  {
    label: "QuickJS WebAssembly sandbox",
    match: (f) => f.includes("quickjs"),
    atLeast: 3,
    because: "code tasks are executed in it",
  },
];

const tracePath = path.join(process.cwd(), TRACE);

if (!fs.existsSync(tracePath)) {
  console.error(
    `verifyBuildTrace: ${TRACE} not found.\n` +
      "Run `npm run build` first — this checks the build output, not the source."
  );
  process.exit(1);
}

const { files = [] } = JSON.parse(fs.readFileSync(tracePath, "utf-8"));

let failed = false;
for (const { label, match, atLeast, because } of REQUIREMENTS) {
  const found = files.filter(match).length;
  if (found >= atLeast) {
    console.log(`  ok    ${label} — ${found} files`);
  } else {
    failed = true;
    console.error(
      `  FAIL  ${label} — found ${found}, expected at least ${atLeast}\n` +
        `        Needed because ${because}.\n` +
        "        Check outputFileTracingIncludes in next.config.mjs; the key must be a glob."
    );
  }
}

console.log(`  (${files.length} files traced for /guides/[id])`);

if (failed) {
  console.error(
    "\nThe build would deploy without files it reads at runtime. " +
      "This does not fail the build on its own — it fails for students."
  );
  process.exit(1);
}

console.log("verifyBuildTrace: ok");
