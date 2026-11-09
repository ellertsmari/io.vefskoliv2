// Seed data for the browser tests. Only ever written to the throwaway mongod
// that start-server.cjs creates; nothing here can reach a real database.
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const PASSWORD = "e2e-pass-123";
const IDS = {
  returnGuide: "6bbbbbbbbbbbbbbbbbbbbbbb",
  quizGuide: "6aaaaaaaaaaaaaaaaaaaaaaa",
};
const USERS = {
  teacher: { name: "Tinna Teacher", email: "teacher@e2e.test", role: "teacher" },
  anna: { name: "Anna Student", email: "anna@e2e.test", role: "user" },
  bjorn: { name: "Bjorn Student", email: "bjorn@e2e.test", role: "user" },
};

async function seed(uri) {
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

  await client.close();
}

module.exports = { seed, PASSWORD, IDS, USERS };
