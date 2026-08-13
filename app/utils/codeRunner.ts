import ts from "typescript";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
// The single-file CJS variant embeds the WebAssembly in the module itself.
// The default entry point reaches its .wasm through a dynamic import, which
// neither Jest's CJS VM nor Vercel's file tracing handle reliably; this one has
// no separate asset to find.
import releaseSyncVariant from "@jitl/quickjs-singlefile-cjs-release-sync";
import {
  CodeConstruct,
  MAX_CODE_LENGTH,
  type CodeFeedback,
  type CodeTestResult,
} from "types/guideTypes";
import { missingConstructs } from "./codeConstructs";

/**
 * Runs a student's TypeScript against a teacher's test cases.
 *
 * SERVER ONLY — pulls in the TypeScript compiler and a WebAssembly interpreter.
 *
 * The submission is type-checked with the real compiler, then stripped and run
 * in QuickJS compiled to WebAssembly. QuickJS is the sandbox because
 * io.vefskoli.is runs on Vercel: native modules are unavailable and worker
 * threads cannot be hard-killed, while a WASM interpreter enforces real time and
 * memory limits and has no filesystem or network access whatsoever (verified:
 * `process`, `require` and `fetch` are all undefined inside it).
 *
 * Type-checking is not just a gate. The guides repeatedly tell students to add
 * types to every variable, and before auto-grading only a human reviewer ever
 * checked that (docs/exercise-engine-tasks.md, decision 4).
 */

/** Wall-clock budget for one submission's worth of test cases. */
const TIME_LIMIT_MS = 2000;
const MEMORY_LIMIT_BYTES = 32 * 1024 * 1024;

export type CodeTestCase = {
  label?: string;
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
};

export type CodeTaskSpec = {
  entryPoint: string;
  tests: CodeTestCase[];
  requires?: CodeConstruct[];
};

// ---------------------------------------------------------------------------
// Source maps: the transpiled output does not keep the student's line numbers
// (erasing a type declaration shifts everything below it), so runtime errors
// have to be mapped back or they point at lines the student never wrote.
// ---------------------------------------------------------------------------

const B64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const decodeVlq = (segment: string): number[] => {
  const out: number[] = [];
  let shift = 0;
  let value = 0;
  for (const ch of segment) {
    const digit = B64.indexOf(ch);
    if (digit < 0) return out;
    const hasContinuation = digit & 32;
    value += (digit & 31) << shift;
    if (hasContinuation) {
      shift += 5;
    } else {
      const negative = value & 1;
      value >>= 1;
      out.push(negative ? -value : value);
      value = 0;
      shift = 0;
    }
  }
  return out;
};

/**
 * generated line (1-based) -> original line (1-based), using the first mapping
 * on each generated line. Line granularity is all the feedback needs.
 */
const buildLineTable = (sourceMapText: string): Map<number, number> => {
  const table = new Map<number, number>();
  try {
    const map = JSON.parse(sourceMapText) as { mappings: string };
    let originalLine = 0;
    map.mappings.split(";").forEach((lineSegments, generatedLine) => {
      if (!lineSegments) return;
      let isFirst = true;
      for (const segment of lineSegments.split(",")) {
        const fields = decodeVlq(segment);
        if (fields.length >= 4) {
          originalLine += fields[2];
          if (isFirst) {
            table.set(generatedLine + 1, originalLine + 1);
            isFirst = false;
          }
        }
      }
    });
  } catch {
    // A malformed map costs line numbers, not the whole result.
  }
  return table;
};

// ---------------------------------------------------------------------------
// Type checking
// ---------------------------------------------------------------------------

const STUDENT_FILE = "/student.ts";

/**
 * Parsed default library files (lib.es2020.d.ts and friends), cached across
 * submissions. They are identical every time and parsing them is by far the
 * most expensive part of a type check — without this, every submission pays
 * the full cost again, which is the difference between a fast response and a
 * serverless function running out of time.
 */
const libFileCache = new Map<string, ts.SourceFile | undefined>();

const typeCheck = (source: string): CodeFeedback["typeErrors"] => {
  const files = new Map([[STUDENT_FILE, source]]);
  const host = ts.createCompilerHost({});
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (name, languageVersion, ...rest) => {
    if (files.has(name)) {
      return ts.createSourceFile(name, files.get(name)!, languageVersion, true);
    }
    if (!libFileCache.has(name)) {
      libFileCache.set(
        name,
        originalGetSourceFile(name, languageVersion, ...rest)
      );
    }
    return libFileCache.get(name);
  };
  host.writeFile = () => {};

  const program = ts.createProgram([STUDENT_FILE], {
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2020,
    // Students write script-scope code, not modules, so a plain
    // `function foo()` stays visible to the harness. TypeScript already treats
    // a file with no import/export as a script; nothing to force here.
  }, host);

  // If the standard library did not load, every global type is missing:
  // `Array` is unknown, so `Person[]` degrades to `{}` and a correct
  // submission is buried in errors about `{}` having no `length`. That is our
  // problem, not the student's, so report nothing and let the tests decide.
  // TypeScript surfaces this as global diagnostics ("cannot find global type").
  if (program.getGlobalDiagnostics().length > 0) {
    console.error(
      "[codeRunner] TypeScript standard library unavailable — skipping the type check.",
      program
        .getGlobalDiagnostics()
        .slice(0, 3)
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "))
    );
    return [];
  }

  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName === STUDENT_FILE && d.start !== undefined)
    .map((d) => {
      const { line, character } = d.file!.getLineAndCharacterOfPosition(
        d.start!
      );
      return {
        line: line + 1,
        column: character + 1,
        message: ts.flattenDiagnosticMessageText(d.messageText, " "),
      };
    });
};

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

/**
 * JSON that is safe to embed in evaluated source. U+2028 and U+2029 are legal
 * inside a JSON string but terminate a line in JavaScript source, so a test case
 * containing one would break out of the harness unless they are escaped.
 */
const embed = (value: unknown): string =>
  JSON.stringify(value ?? null)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/**
 * Embed one argument. A test case can pass a FUNCTION by writing
 * `{ __fn: "n => n + 3" }` — JSON cannot carry a function, and higher-order
 * functions are part of what this guide teaches. The source comes from the
 * teacher's answer key, never from a student, and it runs inside the same
 * sandbox as everything else.
 */
const embedArg = (value: unknown): string => {
  if (value && typeof value === "object" && "__fn" in (value as object)) {
    return String((value as { __fn: unknown }).__fn);
  }
  return embed(value);
};

const embedArgs = (args: unknown[]): string =>
  `[${(args ?? []).map(embedArg).join(", ")}]`;

/** Turn a QuickJS error into something a beginner can act on. */
const describeError = (
  error: { name?: string; message?: string; stack?: string },
  lineTable: Map<number, number>
): NonNullable<CodeFeedback["runtimeError"]> => {
  const message = error?.message ?? "Unknown error";
  const name = error?.name ?? "Error";

  const summary =
    name === "InternalError" && /interrupt/i.test(message)
      ? "Your code ran too long — a loop may never be finishing."
      : /out of memory/i.test(message)
      ? "Your code used too much memory — it may be building an endlessly growing array."
      : name === "TypeError"
      ? "Your code tried to use a value that was not there."
      : name === "ReferenceError"
      ? "Your code used a name that has not been defined."
      : "Your code stopped with an error.";

  const match = /student\.js:(\d+)/.exec(error?.stack ?? "");
  const line = match ? lineTable.get(Number(match[1])) : undefined;

  return { summary, detail: `${name}: ${message}`, line };
};

/**
 * The interpreter is compiled once and reused; each submission still gets a
 * fresh runtime and context, so nothing leaks between students.
 */
let sandboxPromise: ReturnType<typeof newQuickJSWASMModuleFromVariant> | null =
  null;
const getSandbox = () => {
  sandboxPromise ??= newQuickJSWASMModuleFromVariant(releaseSyncVariant);
  return sandboxPromise;
};

const emptyFeedback = (spec: CodeTaskSpec): CodeFeedback => ({
  compiled: false,
  typeErrors: [],
  tests: [],
  testsPassed: 0,
  testsTotal: spec.tests.length,
  constructsMet: (spec.requires ?? []).length === 0,
  missingConstructs: spec.requires ?? [],
});

/**
 * Type-check, run, and check structure. Never throws: a submission that cannot
 * compile or crashes on every case still comes back as feedback.
 */
export const runCodeSubmission = async (
  spec: CodeTaskSpec,
  submission: string
): Promise<CodeFeedback> => {
  const source = (submission ?? "").slice(0, MAX_CODE_LENGTH);
  const feedback = emptyFeedback(spec);

  if (!source.trim()) return feedback;

  // Structure is read from what the student wrote, before types are stripped.
  const missing = missingConstructs(source, spec.requires);
  feedback.missingConstructs = missing;
  feedback.constructsMet = missing.length === 0;

  feedback.typeErrors = typeCheck(source);
  if (feedback.typeErrors.length > 0) {
    // Not compiled: no tests run, and the type errors are the feedback.
    return feedback;
  }
  feedback.compiled = true;

  const emitted = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      sourceMap: true,
    },
    fileName: "student.ts",
  });
  const lineTable = buildLineTable(emitted.sourceMapText ?? "");

  const QuickJS = await getSandbox();
  const runtime = QuickJS.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT_BYTES);
  const deadline = Date.now() + TIME_LIMIT_MS;
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const vm = runtime.newContext();

  try {
    // `export` in student code would otherwise throw; give it somewhere to go.
    const prelude = vm.evalCode(`var exports = {}; var module = { exports: exports };`);
    if (prelude.error) prelude.error.dispose();
    else prelude.value.dispose();

    const defined = vm.evalCode(emitted.outputText, "student.js");
    if (defined.error) {
      const error = vm.dump(defined.error) as { name?: string };
      defined.error.dispose();
      feedback.runtimeError = describeError(error, lineTable);
      feedback.tests = spec.tests.map((test, i) => ({
        label: test.label ?? `Test ${i + 1}`,
        hidden: !!test.hidden,
        passed: false,
      }));
      return feedback;
    }
    defined.value.dispose();

    const results: CodeTestResult[] = [];
    for (const [i, test] of spec.tests.entries()) {
      const label = test.label ?? `Test ${i + 1}`;
      const hidden = !!test.hidden;

      const harness = `(function () {
        var fn = typeof ${spec.entryPoint} === "function"
          ? ${spec.entryPoint}
          : (exports && exports.${spec.entryPoint});
        if (typeof fn !== "function") {
          throw new ReferenceError("Could not find a function called ${spec.entryPoint}");
        }
        return JSON.stringify(fn.apply(null, ${embedArgs(test.args)}) ?? null);
      })()`;

      const run = vm.evalCode(harness, "harness.js");
      if (run.error) {
        const error = vm.dump(run.error) as { name?: string };
        run.error.dispose();
        const described = describeError(error, lineTable);
        feedback.runtimeError ??= described;
        results.push({
          label,
          hidden,
          passed: false,
          ...(hidden ? {} : { error: described.detail }),
        });
        // An interrupt means the budget is gone; the rest cannot run either.
        if (/interrupt/i.test(described.detail)) {
          for (const remaining of spec.tests.slice(i + 1)) {
            results.push({
              label: remaining.label ?? `Test ${results.length + 1}`,
              hidden: !!remaining.hidden,
              passed: false,
            });
          }
          break;
        }
        continue;
      }

      const actual = vm.dump(run.value) as string;
      run.value.dispose();
      const expected = embed(test.expected);
      const passed = actual === expected;

      results.push({
        label,
        hidden,
        passed,
        ...(hidden ? {} : { expected, actual }),
      });
    }

    feedback.tests = results;
    feedback.testsPassed = results.filter((r) => r.passed).length;
    return feedback;
  } finally {
    vm.dispose();
    runtime.dispose();
  }
};
