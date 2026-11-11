// Seed data for the browser tests. Only ever written to the throwaway mongod
// that start-server.cjs creates; nothing here can reach a real database.
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const PASSWORD = "e2e-pass-123";
const IDS = {
  returnGuide: "6bbbbbbbbbbbbbbbbbbbbbbb",
  quizGuide: "6aaaaaaaaaaaaaaaaaaaaaaa",
  // Only seeded with { verify: true }; see seedVerifyExtras below.
  exerciseGuide: "6ccccccccccccccccccccccc",
};
const USERS = {
  teacher: { name: "Tinna Teacher", email: "teacher@e2e.test", role: "teacher" },
  anna: { name: "Anna Student", email: "anna@e2e.test", role: "user" },
  bjorn: { name: "Bjorn Student", email: "bjorn@e2e.test", role: "user" },
};

// Not in USERS: the browser tests sign in as every user listed there.
const VERIFY_USERS = {
  legacy: { name: "Lilja Legacy", email: "legacy@e2e.test", role: "user" },
};

/**
 * The fuller data for checking a change by hand (`yarn e2e:dev`, used by
 * .claude/skills/verify). Kept out of the default seed because the smoke tests
 * count on exactly two guides and three people.
 *
 * - "E2E Full Exercise": six quiz questions over two goals with three served,
 *   one short answer, one code task with a hidden test.
 * - Lilja Legacy: a student with two old numbered attempts at that guide, the
 *   shape the continuous attempt has to merge.
 *     #1: quiz 1 right only on the third try, short answer wrong.
 *     #2: quiz 4 right first time, code task fully passing.
 */
async function seedVerifyExtras(db, { guide, password, now }) {
  const legacy = {
    _id: new ObjectId(),
    ...VERIFY_USERS.legacy,
    password,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("users").insertOne(legacy);

  const quiz = (n, goal) => ({
    _id: new ObjectId(),
    type: "quiz",
    prompt: `Quiz question ${n} (${goal})`,
    options: [`Right answer ${n}`, `Wrong answer ${n}`],
    correctAnswers: [0],
    allowMultiple: false,
    points: 1,
    goal,
    explanation: `Explanation ${n}`,
  });
  const quizTasks = [
    quiz(1, "loops"), quiz(2, "loops"), quiz(3, "loops"),
    quiz(4, "types"), quiz(5, "types"), quiz(6, "types"),
  ];
  const shortTask = {
    _id: new ObjectId(),
    type: "shortAnswer",
    prompt: "Which keyword declares a constant?",
    acceptedAnswers: ["const"],
    points: 1,
    hint: "Short for constant",
  };
  const codeTask = {
    _id: new ObjectId(),
    type: "code",
    prompt: "Write add(a, b) that returns a + b",
    entryPoint: "add",
    starterCode: "function add(a: number, b: number): number {\n  return 0;\n}\n",
    tests: [
      { label: "adds", args: [1, 2], expected: 3 },
      { label: "hidden", args: [5, 5], expected: 10, hidden: true },
    ],
    points: 2,
  };
  const exerciseGuide = guide(IDS.exerciseGuide, "E2E Full Exercise", 3, {
    gradingMode: "auto",
    exercise: {
      passThreshold: 0.7,
      poolSizes: { quiz: 3 },
      tasks: [...quizTasks, shortTask, codeTask],
    },
  });
  await db.collection("guides").insertOne(exerciseGuide);

  const id = (task) => task._id.toString();
  const progress = (tries, correct) => ({
    tries,
    correct,
    firstTryCorrect: correct && tries === 1,
    skipped: false,
  });
  const attempt = (attemptNumber, createdAt, rest) => ({
    guide: exerciseGuide._id,
    owner: legacy._id,
    attemptNumber,
    status: "submitted",
    createdAt,
    passed: false,
    ...rest,
  });
  await db.collection("exerciseattempts").insertMany([
    attempt(1, new Date(now.getTime() - 24 * 60 * 60 * 1000), {
      answers: { [id(quizTasks[0])]: [0], [id(shortTask)]: "var" },
      taskProgress: {
        [id(quizTasks[0])]: progress(3, true),
        [id(shortTask)]: progress(2, false),
      },
      score: 0,
    }),
    attempt(2, now, {
      answers: {
        [id(quizTasks[3])]: [0],
        [id(codeTask)]: "function add(a: number, b: number): number { return a + b; }",
      },
      codeResults: {
        [id(codeTask)]: {
          compiled: true,
          typeErrors: [],
          tests: [],
          testsPassed: 2,
          testsTotal: 2,
          constructsMet: true,
          missingConstructs: [],
        },
      },
      taskProgress: {
        [id(quizTasks[3])]: progress(1, true),
        [id(codeTask)]: progress(1, true),
      },
      score: 4.3,
    }),
  ]);
}

async function seed(uri, { verify = false } = {}) {
  const client = await MongoClient.connect(uri);
  const db = client.db();
  await db.dropDatabase();

  const password = await bcrypt.hash(PASSWORD, 10);
  const now = new Date();
  await db.collection("users").insertMany(
    Object.values(USERS).map((user) => ({
      _id: new ObjectId(),
      ...user,
      password,
      status: "active",
      createdAt: now,
      updatedAt: now,
    }))
  );

  const guide = (id, title, order, extra = {}) => ({
    _id: new ObjectId(id),
    category: "code",
    discipline: "code",
    title,
    description: `What ${title} asks you to build.`,
    createdAt: now,
    updatedAt: now,
    themeIdea: { title: "Theme", description: "A theme to work with." },
    topicsList: "html, css",
    module: { title: "3 - The fundamentals", number: 3 },
    order,
    knowledge: [],
    skills: [],
    resources: [],
    references: [],
    classes: [],
    ...extra,
  });

  const quiz = (n) => ({
    _id: new ObjectId(),
    type: "quiz",
    prompt: `Quiz question ${n}`,
    options: [`Right answer ${n}`, `Wrong answer ${n}`],
    correctAnswers: [0],
    allowMultiple: false,
    points: 1,
    explanation: `Explanation ${n}`,
  });

  await db.collection("guides").insertMany([
    guide(IDS.returnGuide, "E2E Return Guide", 1),
    guide(IDS.quizGuide, "E2E Quiz Guide", 2, {
      gradingMode: "auto",
      exercise: { passThreshold: 0.5, tasks: [quiz(1), quiz(2)] },
    }),
  ]);

  if (verify) await seedVerifyExtras(db, { guide, password, now });

  await client.close();
}

module.exports = { seed, PASSWORD, IDS, USERS, VERIFY_USERS };
