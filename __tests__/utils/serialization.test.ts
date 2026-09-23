import { Types, Schema, model, models } from "mongoose";
import { safeSerialize } from "utils/serialization";

describe("safeSerialize", () => {
  it("turns ObjectIds into hex strings and Dates into ISO strings", () => {
    const id = new Types.ObjectId();
    const when = new Date("2026-09-01T12:00:00.000Z");
    expect(safeSerialize({ _id: id, ids: [id], createdAt: when })).toEqual({
      _id: id.toHexString(),
      ids: [id.toHexString()],
      createdAt: "2026-09-01T12:00:00.000Z",
    });
  });

  it("serializes an object referenced twice in full both times", () => {
    const owner = { name: "Nemandi" };
    expect(safeSerialize({ reviewer: owner, reviewee: owner })).toEqual({
      reviewer: { name: "Nemandi" },
      reviewee: { name: "Nemandi" },
    });
  });

  it("turns a mongoose document into a plain object", () => {
    const Thing =
      models.SerializationThing ||
      model("SerializationThing", new Schema({ title: String }));
    const doc = new Thing({ title: "Guide" });
    expect(safeSerialize(doc)).toEqual({
      _id: doc._id.toHexString(),
      title: "Guide",
    });
  });
});
