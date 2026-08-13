/**
 * @jest-environment node
 */
import { runCodeSubmission, type CodeTaskSpec } from "utils/codeRunner";
import { findConstructs, missingConstructs } from "utils/codeConstructs";
import { CodeConstruct } from "types/guideTypes";

// Compiling and running in a WebAssembly interpreter is not instant.
jest.setTimeout(30000);

const sumSpec: CodeTaskSpec = {
  entryPoint: "totalKids",
  requires: [CodeConstruct.ITERATION],
  tests: [
    {
      label: "two people",
      args: [[{ name: "a", kids: 2 }, { name: "b", kids: 3 }]],
      expected: 5,
    },
    { label: "nobody", args: [[]], expected: 0 },
    {
      label: "hidden case",
      args: [[{ name: "x", kids: 7 }]],
      expected: 7,
      hidden: true,
    },
  ],
};

const WORKING = `type Person = { name: string; kids: number };

function totalKids(people: Person[]): number {
  let total = 0;
  for (const p of people) {
    total += p.kids;
  }
  return total;
}
`;

describe("runCodeSubmission", () => {
  it("passes every test for a correct solution and reports the construct met", async () => {
    const feedback = await runCodeSubmission(sumSpec, WORKING);
    expect(feedback.compiled).toBe(true);
    expect(feedback.typeErrors).toEqual([]);
    expect(feedback.testsPassed).toBe(3);
    expect(feedback.testsTotal).toBe(3);
    expect(feedback.constructsMet).toBe(true);
    expect(feedback.runtimeError).toBeUndefined();
  });

  it("accepts .reduce() as iteration, so a better solution is not punished", async () => {
    const withReduce = `type Person = { name: string; kids: number };

function totalKids(people: Person[]): number {
  return people.reduce((sum, p) => sum + p.kids, 0);
}
`;
    const feedback = await runCodeSubmission(sumSpec, withReduce);
    expect(feedback.testsPassed).toBe(3);
    expect(feedback.constructsMet).toBe(true);
  });

  it("catches hardcoded output through the hidden test", async () => {
    const hardcoded = `function totalKids(people: unknown[]): number {
  if (people.length === 0) return 0;
  return 5;
}
`;
    const feedback = await runCodeSubmission(sumSpec, hardcoded);
    expect(feedback.compiled).toBe(true);
    // The two visible cases pass; the hidden one does not.
    expect(feedback.testsPassed).toBe(2);
    expect(feedback.tests.find((t) => t.hidden)?.passed).toBe(false);
    // ...and it never used iteration either.
    expect(feedback.constructsMet).toBe(false);
  });

  it("reports type errors against the student's own lines and runs nothing", async () => {
    const badTypes = `function totalKids(people: unknown[]): number {
  const wrong: number = "not a number";
  return 0;
}
`;
    const feedback = await runCodeSubmission(sumSpec, badTypes);
    expect(feedback.compiled).toBe(false);
    expect(feedback.typeErrors.length).toBeGreaterThan(0);
    expect(feedback.typeErrors[0].line).toBe(2);
    expect(feedback.tests).toEqual([]);
  });

  /**
   * Regression: in production the TypeScript standard library was missing from
   * the deployment, so `Array` was unknown, `Person[]` degraded to `{}`, and
   * this submission came back with four errors — three of them nonsense about
   * `{}` having no `length`. Only the genuine mistake should be reported.
   */
  it("reports only the student's real mistake, not missing-library noise", async () => {
    const withOneRealError = `type Person = { name: string; kids: number };

function totalChildren(people: Person[]): number {
  if (!people.length) return "people is not an array";
  let total = 0;
  for (let i = 0; i < people.length; i++) {
    total += people[i].kids;
  }
  return total;
}`;
    const feedback = await runCodeSubmission(sumSpec, withOneRealError);
    expect(feedback.compiled).toBe(false);
    expect(feedback.typeErrors).toHaveLength(1);
    expect(feedback.typeErrors[0].line).toBe(4);
    expect(feedback.typeErrors[0].message).toMatch(
      /'string' is not assignable to type 'number'/
    );
    // Nothing about `{}` — that only appears when the library is absent.
    expect(JSON.stringify(feedback.typeErrors)).not.toContain("'{}'");
  });

  it("maps a runtime error back to the line the student wrote", async () => {
    // The type alias is erased when compiling, shifting the emitted lines —
    // the reported line must still be the one in the student's source.
    const throws = `type Person = { name: string; kids: number };

function totalKids(people: Person[]): number {
  const first = people[0] as unknown as { nested: { deep: number } };
  return first.nested.deep;
}
`;
    const feedback = await runCodeSubmission(sumSpec, throws);
    expect(feedback.compiled).toBe(true);
    expect(feedback.runtimeError).toBeDefined();
    expect(feedback.runtimeError!.summary).toMatch(/not there/i);
    expect(feedback.runtimeError!.line).toBe(5);
  });

  it("stops an endless loop and says so in plain language", async () => {
    const endless = `function totalKids(people: unknown[]): number {
  while (true) {}
  return 0;
}
`;
    const feedback = await runCodeSubmission(sumSpec, endless);
    expect(feedback.runtimeError?.summary).toMatch(/ran too long/i);
    expect(feedback.testsPassed).toBe(0);
    // Every case is accounted for even though the budget ran out.
    expect(feedback.tests).toHaveLength(3);
  });

  it("has no access to the host", async () => {
    const nosy = `function totalKids(people: unknown[]): unknown {
  return [
    typeof (globalThis as any).process,
    typeof (globalThis as any).require,
    typeof (globalThis as any).fetch,
  ];
}
`;
    const feedback = await runCodeSubmission(
      { entryPoint: "totalKids", tests: [{ args: [[]], expected: ["undefined", "undefined", "undefined"] }] },
      nosy
    );
    expect(feedback.testsPassed).toBe(1);
  });

  it("says so plainly when the function is not defined", async () => {
    const feedback = await runCodeSubmission(sumSpec, `const x: number = 1;`);
    expect(feedback.compiled).toBe(true);
    expect(feedback.runtimeError?.detail).toMatch(/totalKids/);
  });

  it("never reveals a hidden test's expected value", async () => {
    const feedback = await runCodeSubmission(sumSpec, WORKING.replace("total += p.kids", "total += 0"));
    const hidden = feedback.tests.find((t) => t.hidden)!;
    expect(hidden.passed).toBe(false);
    expect(hidden.expected).toBeUndefined();
    expect(hidden.actual).toBeUndefined();
    expect(JSON.stringify(feedback)).not.toContain('"7"');
  });

  it("returns empty feedback for a blank submission rather than throwing", async () => {
    const feedback = await runCodeSubmission(sumSpec, "   ");
    expect(feedback.compiled).toBe(false);
    expect(feedback.testsPassed).toBe(0);
  });
});

describe("findConstructs", () => {
  it("recognises each kind of loop", () => {
    expect(findConstructs("for (let i=0;i<3;i++){}")).toContain(
      CodeConstruct.LOOP
    );
    expect(findConstructs("for (const x of []) {}")).toContain(
      CodeConstruct.LOOP
    );
    expect(findConstructs("while (false) {}")).toContain(CodeConstruct.LOOP);
  });

  it("treats a loop and an array method alike as iteration", () => {
    expect(findConstructs("for (const x of []) {}")).toContain(
      CodeConstruct.ITERATION
    );
    expect(findConstructs("[].map(x => x)")).toContain(CodeConstruct.ITERATION);
    expect(findConstructs("const x = 1;")).not.toContain(
      CodeConstruct.ITERATION
    );
  });

  it("spots recursion only when a function calls itself", () => {
    expect(findConstructs("function f(n: number) { return f(n - 1); }")).toContain(
      CodeConstruct.RECURSION
    );
    expect(findConstructs("function f(n: number) { return n; }")).not.toContain(
      CodeConstruct.RECURSION
    );
  });

  it("spots type annotations in their various forms", () => {
    expect(findConstructs("let n: number = 1;")).toContain(
      CodeConstruct.TYPE_ANNOTATION
    );
    expect(findConstructs("function f(a: string) {}")).toContain(
      CodeConstruct.TYPE_ANNOTATION
    );
    expect(findConstructs("type P = { a: number };")).toContain(
      CodeConstruct.TYPE_ANNOTATION
    );
    expect(findConstructs("let n = 1;")).not.toContain(
      CodeConstruct.TYPE_ANNOTATION
    );
  });

  it("reports nothing missing when nothing is required", () => {
    expect(missingConstructs("const x = 1;", [])).toEqual([]);
    expect(missingConstructs("const x = 1;")).toEqual([]);
  });
});
