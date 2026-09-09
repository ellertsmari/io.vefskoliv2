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
});
