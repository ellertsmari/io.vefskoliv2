/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyGuide,
} from "../__mocks__/mongoHandler";
import { Guide } from "models/guide";
import { PUT } from "app/api/guides/[id]/route";
import { getGuideForTeacher } from "serverActions/getGuide";
import {
  buildGuidePayload,
  exerciseFromGuide,
  formFromGuide,
} from "app/components/editGuides/editGuidePayload";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

const put = (id: string, body: unknown) =>
  PUT(
    new NextRequest(`http://localhost/api/guides/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

/** Guides in one module, keyed by the order they start with. */
const seedModule = async (title: string, orders: Array<number | string>) => {
  const ids: Record<string, string> = {};
  for (const order of orders) {
    const guide = await createDummyGuide();
    // Written straight to the collection so a string order survives, the way
    // a Compass import leaves it.
    await Guide.collection.updateOne(
      { _id: guide._id },
      { $set: { module: { title, number: 0 }, order } }
    );
    ids[String(order)] = String(guide._id);
  }
  return ids;
};

const ordersOf = async (ids: Record<string, string>) => {
  const rows = await Guide.find({}, { order: 1 }).lean<{ _id: unknown; order: unknown }[]>();
  const byId = new Map(rows.map((row) => [String(row._id), row.order]));
  return Object.fromEntries(Object.entries(ids).map(([was, id]) => [was, byId.get(id)]));
};

describe("PUT /api/guides/[id] order", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });
  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "abc", role: "teacher" } });
  });

  it("moves the guides in between out of the way when a guide takes a taken number", async () => {
    const ids = await seedModule("3 - The fundamentals", [1, 2, 3, 4, "5", 6, 7]);
    // Another module with the same numbers must not move.
    const elsewhere = await seedModule("4 - Something else", [3, 4]);

    const response = await put(ids["2"], { order: 5 });
    expect(response.status).toBe(200);
    expect((await response.json()).shifted).toBe(3);

    expect(await ordersOf(ids)).toEqual({
      "1": 1,
      "2": 5,
      "3": 2,
      "4": 3,
      "5": 4,
      "6": 6,
      "7": 7,
    });
    expect(await ordersOf(elsewhere)).toEqual({ "3": 3, "4": 4 });
  });

  it("moves nothing when the number is free or unchanged", async () => {
    const ids = await seedModule("3 - The fundamentals", [1, 2, 4]);

    expect((await (await put(ids["1"], { order: 3 })).json()).shifted).toBe(0);
    expect((await (await put(ids["2"], { order: 2, title: "Renamed" })).json()).shifted).toBe(0);

    expect(await ordersOf(ids)).toEqual({ "1": 3, "2": 2, "4": 4 });
  });

  it("makes room in the new module when a guide changes module", async () => {
    const from = await seedModule("2 - Design", [1, 2]);
    const to = await seedModule("3 - The fundamentals", [1, 2, 3]);

    const response = await put(from["1"], {
      order: 2,
      module: { title: "3 - The fundamentals", number: 3 },
    });
    expect((await response.json()).shifted).toBe(2);

    expect(await ordersOf(to)).toEqual({ "1": 1, "2": 3, "3": 4 });
    expect(await ordersOf(from)).toEqual({ "1": 2, "2": 2 });
  });

  it("refuses students", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "abc", role: "user" } });
    const ids = await seedModule("3 - The fundamentals", [1, 2]);
    expect((await put(ids["1"], { order: 2 })).status).toBe(401);
    expect(await ordersOf(ids)).toEqual({ "1": 1, "2": 2 });
  });

  it("saves a guide with hand-authored tasks twice in a row", async () => {
    const guide = await createDummyGuide();
    await Guide.collection.updateOne(
      { _id: guide._id },
      {
        $set: {
          module: { title: "3 - The fundamentals", number: 3 },
          gradingMode: "auto",
          exercise: {
            passThreshold: 0.7,
            poolSizes: { shortAnswer: 1 },
            tasks: [
              { type: "quiz", prompt: "Pick one", options: ["a", "b"], correctAnswers: [0], points: 1 },
              { type: "shortAnswer", prompt: "Type it", acceptedAnswers: ["x"], points: 1 },
              { type: "shortAnswer", prompt: "Type it again", acceptedAnswers: ["y"], points: 1 },
              { type: "code", prompt: "Write it", entryPoint: "f", tests: [], points: 2 },
            ],
          },
        },
      }
    );
    const id = String(guide._id);

    // What the editor sends: the guide as loaded, straight back.
    const roundTrip = async () => {
      const loaded = await getGuideForTeacher(id);
      const payload = buildGuidePayload(
        formFromGuide(loaded!),
        exerciseFromGuide(loaded!),
        "auto",
        "code",
        false
      );
      return put(id, payload);
    };

    expect((await roundTrip()).status).toBe(200);
    // Mongoose has now added empty `options`/`correctAnswers` arrays to the
    // non-quiz tasks; that must not make them look like broken quizzes.
    const second = await roundTrip();
    expect(await second.json()).not.toHaveProperty("issues");
    expect(second.status).toBe(200);

    // A real quiz question with too few options is still refused.
    const broken = await put(id, {
      exercise: {
        passThreshold: 0.7,
        tasks: [{ type: "quiz", prompt: "Pick one", options: ["a"], correctAnswers: [0] }],
      },
    });
    expect(broken.status).toBe(400);
    expect((await broken.json()).issues.map((i: { path: string }) => i.path)).toEqual([
      "exercise.tasks.0.options",
    ]);

    const saved = await Guide.findById(id).lean<{ exercise: { tasks: { type: string }[]; poolSizes: unknown } }>();
    expect(saved!.exercise.tasks.map((t) => t.type)).toEqual(["quiz", "shortAnswer", "shortAnswer", "code"]);
    expect(saved!.exercise.poolSizes).toEqual({ shortAnswer: 1 });
  });
});
