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
import { selectServedTasks, seededRng } from "utils/exerciseUtils";

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
  helloWorld: `function helloWorld(): string {
  return "Hello, world!";
}`,
  greet: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`,
  double: `function double(n: number): number {
  return n * 2;
}`,
  isAdult: `function isAdult(age: number): boolean {
  if (age >= 18) {
    return true;
  }
  return false;
}`,
  describeNumber: `function describeNumber(n: number): string {
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "zero";
}`,
  triple: `const triple = (n: number): number => n * 3;`,
  sumNumbers: `function sumNumbers(numbers: number[]): number {
  let total: number = 0;
  for (const n of numbers) {
    total += n;
  }
  return total;
}`,
  largest: `function largest(numbers: number[]): number {
  let biggest: number = numbers[0];
  for (const n of numbers) {
    if (n > biggest) biggest = n;
  }
  return biggest;
}`,
  countAdults: `function countAdults(ages: number[]): number {
  let count: number = 0;
  for (const age of ages) {
    if (age >= 18) count += 1;
  }
  return count;
}`,
  namesOf: `type Person = { name: string; age: number };

function namesOf(people: Person[]): string[] {
  return people.map((person) => person.name);
}`,
  adultsOnly: `type Person = { name: string; age: number };

function adultsOnly(people: Person[]): Person[] {
  return people.filter((person) => person.age >= 18);
}`,
  describePeople: `type Person = { name: string; age: number };

function describePeople(people: Person[]): string[] {
  const out: string[] = [];
  for (const person of people) {
    out.push(\`\${person.name}: \${person.age}\`);
  }
  return out;
}`,
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
  applyTwice: `function applyTwice(fn: (n: number) => number, value: number): number {
  return fn(fn(value));
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

const readGuide = () => {
  if (!fs.existsSync(GUIDES)) return null;
  const guides = JSON.parse(fs.readFileSync(GUIDES, "utf-8"));
  return guides.find((g: { title?: string }) => g.title?.startsWith(GUIDE_TITLE));
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

/**
 * The guide promises eleven things a student will know and be able to do.
 * A plain random draw would leave some students never asked about several of
 * them, so the quiz draw is stratified by goal. This proves it across a whole
 * cohort rather than trusting the mechanism.
 */
describeIfPresent("every student is asked about every goal", () => {
  it("covers all knowledge and skill points in multiple choice, for 200 students", () => {
    const guide = readGuide();
    const goals: string[] = [
      ...guide.knowledge.map((k: { knowledge: string }) => k.knowledge),
      ...guide.skills.map((s: { skill: string }) => s.skill),
    ];

    const gaps: string[] = [];
    for (let student = 0; student < 200; student++) {
      const served = selectServedTasks(
        guide.exercise,
        seededRng(`student-${student}:guide:1`)
      );
      const covered = new Set(
        served.filter((t) => t.type === "quiz").map((t) => t.goal)
      );
      for (const goal of goals) {
        if (!covered.has(goal)) {
          gaps.push(`student ${student}: ${goal.slice(0, 45)}`);
        }
      }
    }
    expect(gaps).toEqual([]);
  });

  it("still varies which question each student gets for a goal", () => {
    const guide = readGuide();
    const perGoal = new Map<string, Set<string>>();
    for (let student = 0; student < 200; student++) {
      const served = selectServedTasks(
        guide.exercise,
        seededRng(`student-${student}:guide:1`)
      );
      for (const task of served) {
        if (task.type !== "quiz" || !task.goal) continue;
        const set = perGoal.get(task.goal) ?? new Set<string>();
        set.add(task.prompt);
        perGoal.set(task.goal, set);
      }
    }
    // Coverage must not collapse into "everyone gets the same question".
    for (const [goal, prompts] of perGoal) {
      expect({ goal, distinct: prompts.size }).toEqual({
        goal,
        distinct: expect.any(Number),
      });
      expect(prompts.size).toBeGreaterThan(1);
    }
  });
});
