/**
 * @jest-environment node
 *
 * Runs the authored code tasks for real.
 *
 * A bad test case cannot be fixed in front of a stuck student — there is no
 * authoring UI, so it means a hand edit in Compass. Every code task therefore
 * has to be proved before it ships: a reference solution passes every case, and
 * the starter code does not.
 *
 * Skips when dbBackup/ is absent, since the guide collection is gitignored and
 * CI has no copy. Locally it runs with `npm test`.
 */
import fs from "node:fs";
import path from "node:path";
import { runCodeSubmission } from "utils/codeRunner";

jest.setTimeout(120000);

const GUIDES = path.join(process.cwd(), "dbBackup/Hopur11.guides.json");
const GUIDE_TITLE = "TypeScript Introduction";

/**
 * A correct solution per code task, keyed by entry point.
 *
 * Adding a code task without adding one here fails the suite by design: an
 * unproved task is one nobody has confirmed is solvable as written.
 */
const REFERENCE_SOLUTIONS: Record<string, string> = {
  totalChildren: `type Person = { name: string; kids: number };

function totalChildren(people: Person[]): number {
  let total: number = 0;
  for (const person of people) {
    total += person.kids;
  }
  return total;
}`,
  greetByCountry: `function greetByCountry(country: string): string {
  if (country === "Iceland") return "Hæ";
  if (country === "Spain") return "Hola";
  if (country === "Korea") return "안녕";
  return "Hello";
}`,
  describePeople: `type Person = { name: string; age: number };

function describePeople(people: Person[]): string[] {
  const out: string[] = [];
  for (const person of people) {
    out.push(\`\${person.name}: \${person.age}\`);
  }
  return out;
}`,
  addContact: `type Contact = { name?: string; email?: string; phone?: string };

function addContact(list: Contact[], contact: Contact): string {
  if (!contact.name || !contact.email) {
    return "Missing fields";
  }
  for (const existing of list) {
    if (existing.email === contact.email) {
      return "Duplicate was found";
    }
  }
  return \`\${contact.name} was added\`;
}`,
};

type CodeTask = {
  entryPoint: string;
  prompt: string;
  starterCode?: string;
  tests: { args: unknown[]; expected: unknown; hidden?: boolean; label?: string }[];
  requires?: string[];
};

const readCodeTasks = (): CodeTask[] => {
  if (!fs.existsSync(GUIDES)) return [];
  const guides = JSON.parse(fs.readFileSync(GUIDES, "utf-8"));
  const guide = guides.find((g: { title?: string }) =>
    g.title?.startsWith(GUIDE_TITLE)
  );
  return (guide?.exercise?.tasks ?? []).filter(
    (t: { type: string }) => t.type === "code"
  );
};

const codeTasks = readCodeTasks();
const describeIfPresent = codeTasks.length > 0 ? describe : describe.skip;

if (codeTasks.length === 0) {
  // eslint-disable-next-line no-console
  console.log(
    `[exerciseBank] ${GUIDES} not present — skipping. Export the collection from Compass to run these.`
  );
}

describeIfPresent("authored code tasks", () => {
  it("has a reference solution for every code task", () => {
    const unproved = codeTasks
      .filter((t) => !REFERENCE_SOLUTIONS[t.entryPoint])
      .map((t) => t.entryPoint);
    expect(unproved).toEqual([]);
  });

  for (const task of codeTasks) {
    const solution = REFERENCE_SOLUTIONS[task.entryPoint];
    if (!solution) continue;

    it(`${task.entryPoint}: a correct solution passes every case`, async () => {
      const feedback = await runCodeSubmission(
        {
          entryPoint: task.entryPoint,
          tests: task.tests,
          requires: task.requires as never,
        },
        solution
      );
      if (feedback.typeErrors.length) {
        // eslint-disable-next-line no-console
        console.log(task.entryPoint, feedback.typeErrors);
      }
      if (feedback.runtimeError) {
        // eslint-disable-next-line no-console
        console.log(task.entryPoint, feedback.runtimeError);
      }
      const failures = feedback.tests.filter((t) => !t.passed);
      if (failures.length) {
        // eslint-disable-next-line no-console
        console.log(task.entryPoint, failures);
      }
      expect(feedback.compiled).toBe(true);
      expect(feedback.typeErrors).toEqual([]);
      expect(feedback.testsPassed).toBe(task.tests.length);
      expect(feedback.constructsMet).toBe(true);
    });

    it(`${task.entryPoint}: the starter code does NOT pass`, async () => {
      const feedback = await runCodeSubmission(
        {
          entryPoint: task.entryPoint,
          tests: task.tests,
          requires: task.requires as never,
        },
        task.starterCode ?? ""
      );
      expect(feedback.testsPassed).toBeLessThan(task.tests.length);
    });

    it(`${task.entryPoint}: a hidden case stops a hardcoded answer`, () => {
      expect(task.tests.some((t) => t.hidden)).toBe(true);
    });
  }
});
