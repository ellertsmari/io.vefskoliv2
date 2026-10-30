/**
 * @jest-environment node
 */
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyGuide,
} from "../__mocks__/mongoHandler";
import { Guide } from "models/guide";
import { getPublicGuides } from "serverActions/getPublicGuides";

describe("getPublicGuides", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  it("leaves out drafts a teacher hasn't written yet", async () => {
    const written = await createDummyGuide();
    const draft = await createDummyGuide();
    await Guide.updateOne(
      { _id: draft._id },
      { title: "Untitled guide", description: "TODO: add a description" }
    );

    const guides = await getPublicGuides();

    expect(guides?.map((g) => String(g._id))).toEqual([String(written._id)]);
  });
});
