/**
 * @jest-environment node
 */
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyGuide,
  createDummyReturn,
  createDummyReview,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { getReturnSummary } from "serverActions/getReturnSummary";
import { ReturnStatus } from "types/guideTypes";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("getReturnSummary", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it("is null before the student has returned the guide", async () => {
    const anna = await createDummyUser();
    const guide = await createDummyGuide();
    (auth as jest.Mock).mockResolvedValue({ user: { id: anna._id.toString() } });

    expect(await getReturnSummary(guide._id.toString())).toBeNull();
  });

  it("describes the latest return and counts the reviews on it", async () => {
    const anna = await createDummyUser();
    const guide = await createDummyGuide();
    const first = await createDummyReturn(anna, guide);
    await createDummyReview(undefined, guide, first, true);
    await createDummyReview(undefined, guide, first, true);
    // A day later, a fresh return: the two "no pass" reviews no longer count.
    const second = await createDummyReturn(anna, guide);
    second.createdAt = new Date(Date.now() + 86_400_000);
    await second.save();
    await createDummyReview(undefined, guide, second);
    (auth as jest.Mock).mockResolvedValue({ user: { id: anna._id.toString() } });

    const summary = await getReturnSummary(guide._id.toString());

    expect(summary).toEqual(
      expect.objectContaining({
        id: second._id.toString(),
        projectName: second.projectName,
        status: ReturnStatus.AWAITING_REVIEWS,
        reviewsReceived: 1,
        reviewsNeeded: 2,
        returnCount: 2,
      })
    );
  });

  it("only ever looks at the signed-in student's own returns", async () => {
    const anna = await createDummyUser();
    const bjarni = await createDummyUser();
    const guide = await createDummyGuide();
    await createDummyReturn(bjarni, guide);
    (auth as jest.Mock).mockResolvedValue({ user: { id: anna._id.toString() } });

    expect(await getReturnSummary(guide._id.toString())).toBeNull();
    (auth as jest.Mock).mockResolvedValue(null);
    expect(await getReturnSummary(guide._id.toString())).toBeNull();
  });
});
