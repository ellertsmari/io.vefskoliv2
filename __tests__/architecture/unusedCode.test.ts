/**
 * @jest-environment node
 *
 * No unused imports and no unused files.
 *
 * Both creep in quietly and neither breaks the build. An editor's auto-import
 * once put `import { i } from "node_modules/@vercel/blob/dist/create-folder-…"`
 * into the gallery styles: unused, pointing at a hashed internal file of a
 * dependency, and only harmless because the compiler happened to drop it. An
 * unused file is worse in a different way — it looks like live code, so the
 * next person reads it, fixes it and tests it, and none of that ships.
 *
 * Unused imports: every binding an import declaration introduces must be
 * referenced somewhere else in the same file. Side-effect imports
 * (`import "./globals.css"`) bind nothing and are fine.
 *
 * Unused files: a code file under app/ or types/ must be reachable by imports
 * from something Next.js (or our tooling) loads by itself — a page, layout,
 * route, the proxy, a config file, a script. Tests are deliberately NOT entry
 * points: a component that only its own test imports is still dead code.
 *
 * This reads each file's syntax with the TypeScript parser rather than
 * type-checking the project, so it runs in a couple of seconds. It leans
 * towards passing: a name that also appears as a local variable counts as a
 * use. It never reports a used import as unused.
 *
 * KNOWN_UNUSED_FILES is debt that predates this test. It only shrinks.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".next-verify", ".git", "public", "dbBackup", "coverage"]);
const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;

/** Only ever remove entries from this list. */
const KNOWN_UNUSED_FILES: string[] = [
  // Canvas grade sync: built and tested ahead of the LTI developer key from
  // school IT, wired in once that arrives. Kept on purpose, not abandoned.
  "app/lib/canvas/resolveScore.ts",
  "app/lib/canvas/routing.ts",
  "app/lib/canvas/types.ts",
  "app/models/canvasCourse.ts",
  "app/models/canvasLineItem.ts",
  "app/models/canvasUser.ts",
];

/**
 * Files Next.js loads by convention, matched on the file name inside app/.
 * https://nextjs.org/docs/app/api-reference/file-conventions
 */
const NEXT_ROUTE_FILES =
  /^(page|layout|template|loading|error|global-error|not-found|forbidden|unauthorized|route|default|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest)\.(tsx?|jsx?)$/;

/** Files loaded by Next.js, jest or a person running them, outside app/. */
const isEntryPoint = (repoPath: string): boolean =>
  (repoPath.startsWith("app/") && NEXT_ROUTE_FILES.test(path.basename(repoPath))) ||
  /^(proxy|middleware|instrumentation|instrumentation-client)\.(ts|js)$/.test(repoPath) ||
  /^(next|jest)\.config\.(ts|js|mjs|cjs)$/.test(repoPath) ||
  /^jest\.setup\.(ts|js)$/.test(repoPath) ||
  repoPath.startsWith("scripts/");

/** Where unused files are looked for. Type declaration files are ambient. */
const isCandidate = (repoPath: string): boolean =>
  /^(app|types)\//.test(repoPath) && !repoPath.endsWith(".d.ts");

const toPosix = (p: string) => p.split(path.sep).join("/");
const repoPathOf = (abs: string) => toPosix(path.relative(ROOT, abs));

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP_DIRS.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return CODE.test(entry.name) ? [full] : [];
  });

const allFiles = walk(ROOT);

const parse = (file: string): ts.SourceFile =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf-8"),
    ts.ScriptTarget.Latest,
    true,
    /x$/.test(file) ? ts.ScriptKind.TSX : file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS
  );

const sources = new Map(allFiles.map((f) => [f, parse(f)]));

// ---------------------------------------------------------------------------
// Unused imports
// ---------------------------------------------------------------------------

/** An identifier that only names a property or attribute, not a binding. */
const isNameOnly = (node: ts.Identifier): boolean => {
  const parent = node.parent;
  return (
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isQualifiedName(parent) && parent.right === node) ||
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isJsxAttribute(parent) && parent.name === node) ||
    ((ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isMethodSignature(parent) ||
      ts.isEnumMember(parent)) &&
      parent.name === node)
  );
};

const unusedImportsIn = (source: ts.SourceFile): string[] => {
  const imported: string[] = [];
  const used = new Set<string>();

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      if (clause?.name) imported.push(clause.name.text);
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) imported.push(bindings.name.text);
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) imported.push(element.name.text);
      }
      return; // names inside the declaration itself are not uses
    }
    if (ts.isImportEqualsDeclaration(node)) {
      imported.push(node.name.text);
      visit(node.moduleReference);
      return;
    }
    if (ts.isIdentifier(node) && !isNameOnly(node)) used.add(node.text);
    // `{ foo }` in an object literal refers to the binding `foo`.
    if (ts.isShorthandPropertyAssignment(node)) used.add(node.name.text);
    // `{@link Foo}` in a doc comment counts, as it does for the type checker.
    for (const doc of ts.getJSDocCommentsAndTags(node)) {
      ts.forEachChild(doc, function link(child) {
        if (ts.isIdentifier(child)) used.add(child.text);
        ts.forEachChild(child, link);
      });
      if (ts.isJSDoc(doc) && Array.isArray(doc.comment)) {
        for (const part of doc.comment) if (part.name && ts.isIdentifier(part.name)) used.add(part.name.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return imported.filter((name) => !used.has(name));
};

const collectUnusedImports = (): string[] =>
  [...sources]
    .filter(([file]) => !repoPathOf(file).startsWith("scripts/"))
    .flatMap(([file, source]) =>
      unusedImportsIn(source).map((name) => `${repoPathOf(file)}: ${name}`)
    )
    .sort();

// ---------------------------------------------------------------------------
// Unused files
// ---------------------------------------------------------------------------

const compilerOptions = (() => {
  const config = ts.readConfigFile(path.join(ROOT, "tsconfig.json"), ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT).options;
})();

const moduleSpecifiers = (source: ts.SourceFile): string[] => {
  const specifiers: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    // import("./x"), require("./x")
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return specifiers;
};

const resolve = (specifier: string, fromFile: string): string | null => {
  const { resolvedModule } = ts.resolveModuleName(specifier, fromFile, compilerOptions, ts.sys);
  if (!resolvedModule || resolvedModule.isExternalLibraryImport) return null;
  const resolved = path.resolve(resolvedModule.resolvedFileName);
  return sources.has(resolved) ? resolved : null;
};

const collectUnusedFiles = (): string[] => {
  const reached = new Set<string>();
  const queue = allFiles.filter((f) => isEntryPoint(repoPathOf(f)));
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (reached.has(file)) continue;
    reached.add(file);
    for (const specifier of moduleSpecifiers(sources.get(file)!)) {
      const target = resolve(specifier, file);
      if (target && !reached.has(target)) queue.push(target);
    }
  }
  return allFiles
    .map(repoPathOf)
    .filter((p) => isCandidate(p) && !reached.has(path.join(ROOT, p)))
    .sort();
};

// ---------------------------------------------------------------------------

describe("unused code", () => {
  it("has no unused imports", () => {
    const unused = collectUnusedImports();
    if (unused.length > 0) {
      throw new Error(
        "These imports are never used in their file:\n\n" +
          unused.map((u) => "  " + u).join("\n") +
          "\n\nDelete them. Editors add imports while you type, and leave them" +
          "\nbehind when you change your mind — check the top of every file" +
          "\nyou touched before you push."
      );
    }
  });

  const unusedFiles = collectUnusedFiles();

  it("has no unused files", () => {
    const unexpected = unusedFiles.filter((f) => !KNOWN_UNUSED_FILES.includes(f));
    if (unexpected.length > 0) {
      throw new Error(
        "Nothing the app loads imports these files, directly or indirectly:\n\n" +
          unexpected.map((f) => "  " + f).join("\n") +
          "\n\nIf a file is left over from something you removed, delete it." +
          "\nIf it is new, import it from where it is used. Tests do not count:" +
          "\na component that only its own test imports never reaches a student." +
          "\n\nSee this file's header for what counts as an entry point."
      );
    }
  });

  it("known unused files are actually still unused, so the list stays honest", () => {
    expect(KNOWN_UNUSED_FILES.filter((f) => !unusedFiles.includes(f))).toEqual([]);
  });

  it("actually inspects files, so a broken matcher cannot pass silently", () => {
    expect(allFiles.filter((f) => isCandidate(repoPathOf(f))).length).toBeGreaterThan(200);
    expect(allFiles.filter((f) => isEntryPoint(repoPathOf(f))).length).toBeGreaterThan(20);

    const check = (code: string) => unusedImportsIn(ts.createSourceFile("x.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
    expect(check(`import { a, b } from "m"; a();`)).toEqual(["b"]);
    expect(check(`import A from "m"; const x = <A />;`)).toEqual([]);
    expect(check(`import type { T } from "m"; let v: T;`)).toEqual([]);
    expect(check(`import * as ns from "m"; ns.f();`)).toEqual([]);
    expect(check("import { S } from \"m\"; const C = styled.div`${S} {}`;")).toEqual([]);
    expect(check(`import { i } from "m"; obj.i = 1;`)).toEqual(["i"]);
    expect(check(`import { x } from "m"; export { x };`)).toEqual([]);
    expect(check(`import "./side-effect.css";`)).toEqual([]);

    // The alias resolution the graph depends on.
    expect(resolve("utils/serialization", path.join(ROOT, "app/page.tsx"))).toBe(
      path.join(ROOT, "app/utils/serialization.ts")
    );
  });
});
