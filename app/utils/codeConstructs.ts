import ts from "typescript";
import { CodeConstruct } from "types/guideTypes";

/**
 * Does the submission actually use the thing the guide teaches?
 *
 * Hidden test cases already stop a student pasting the expected output, so this
 * exists for the other half: a guide about loops should assess a loop. It is
 * worth a slice of the marks rather than acting as a gate, because a student who
 * solves an iteration exercise with .reduce() has written better code, not worse
 * (docs/exercise-engine-tasks.md, decision 6).
 *
 * Checked against the TypeScript AST of what the student wrote, before types are
 * stripped — so `typeAnnotation` is still visible.
 */

/** Array methods that count as iterating over a collection. */
const ITERATION_METHODS = new Set([
  "map",
  "filter",
  "reduce",
  "reduceRight",
  "forEach",
  "find",
  "findIndex",
  "some",
  "every",
  "flatMap",
]);

type Found = Set<CodeConstruct>;

const isLoop = (node: ts.Node): boolean =>
  ts.isForStatement(node) ||
  ts.isForOfStatement(node) ||
  ts.isForInStatement(node) ||
  ts.isWhileStatement(node) ||
  ts.isDoStatement(node);

const isConditional = (node: ts.Node): boolean =>
  ts.isIfStatement(node) ||
  ts.isConditionalExpression(node) ||
  ts.isSwitchStatement(node);

const isFunctionLike = (node: ts.Node): boolean =>
  ts.isFunctionDeclaration(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  ts.isMethodDeclaration(node);

/** An array method call like `people.map(...)`. */
const arrayMethodName = (node: ts.Node): string | undefined => {
  if (!ts.isCallExpression(node)) return undefined;
  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee)) return undefined;
  const name = callee.name.text;
  return ITERATION_METHODS.has(name) ? name : undefined;
};

/** The name a function-like node is known by, for the recursion check. */
const functionName = (node: ts.Node): string | undefined => {
  if (ts.isFunctionDeclaration(node)) return node.name?.text;
  if (
    (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }
  return undefined;
};

/** Does this function's body call the given name? */
const callsName = (body: ts.Node, name: string): boolean => {
  let found = false;
  const walk = (node: ts.Node) => {
    if (found) return;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, walk);
  };
  ts.forEachChild(body, walk);
  return found;
};

/** Every construct present in the submission. */
export const findConstructs = (source: string): Found => {
  const found: Found = new Set();
  const file = ts.createSourceFile(
    "constructs.ts",
    source,
    ts.ScriptTarget.ES2020,
    true
  );

  const visit = (node: ts.Node) => {
    if (isLoop(node)) found.add(CodeConstruct.LOOP);
    if (isConditional(node)) found.add(CodeConstruct.CONDITIONAL);
    if (isFunctionLike(node)) {
      found.add(CodeConstruct.FUNCTION);
      if (ts.isArrowFunction(node)) found.add(CodeConstruct.ARROW_FUNCTION);
      const name = functionName(node);
      const body = (node as ts.FunctionLikeDeclaration).body;
      if (name && body && callsName(body, name)) {
        found.add(CodeConstruct.RECURSION);
      }
    }
    if (arrayMethodName(node)) found.add(CodeConstruct.ARRAY_METHOD);

    // A type annotation anywhere: `let n: number`, a typed parameter, a return
    // type, or a declared type/interface.
    if (
      (ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isPropertySignature(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node)) &&
      (node as { type?: ts.TypeNode }).type
    ) {
      found.add(CodeConstruct.TYPE_ANNOTATION);
    }
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      found.add(CodeConstruct.TYPE_ANNOTATION);
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(file, visit);

  // Either way of walking a collection satisfies `iteration`.
  if (found.has(CodeConstruct.LOOP) || found.has(CodeConstruct.ARRAY_METHOD)) {
    found.add(CodeConstruct.ITERATION);
  }

  return found;
};

/** Which of the required constructs are missing from the submission. */
export const missingConstructs = (
  source: string,
  required: CodeConstruct[] = []
): CodeConstruct[] => {
  if (required.length === 0) return [];
  const found = findConstructs(source);
  return required.filter((c) => !found.has(c));
};
