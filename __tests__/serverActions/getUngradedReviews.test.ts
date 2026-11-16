/**
 * @jest-environment node
 */
import mongoose from "mongoose";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyGuide,
  createDummyReturn,
  createDummyReview,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import {
  getUngradedReviewCount,
  getUngradedReviews,
} from "serverActions/getUngradedReviews";
import { Review } from "models/review";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

const asTeacher = () =>
  (auth as jest.Mock).mockResolvedValue({ user: { id: "t", role: "teacher" } });

describe("getUngradedReviews", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it("returns nothing to a student", async () => {
    const reviewer = await createDummyUser();
    await createDummyReview(reviewer, await createDummyGuide());
    (auth as jest.Mock).mockResolvedValue({ user: { id: "s", role: "user" } });

    expect(await getUngradedReviews()).toEqual([]);
    expect(await getUngradedReviewCount()).toBe(0);
  });

  it("lists ungraded reviews oldest first with their guide, return and people", async () => {
    const author = await createDummyUser();
    const reviewer = await createDummyUser();
    const guide = await createDummyGuide();
    const returned = await createDummyReturn(author, guide);

    // One review per reviewer and return: the collection enforces it.
    const newer = await createDummyReview(await createDummyUser(), guide, returned);
    const older = await createDummyReview(reviewer, guide, returned);
    await Review.updateOne(
      { _id: older._id },
      { createdAt: new Date(Date.now() - 86_400_000) }
    );
    const graded = await createDummyReview(await createDummyUser(), guide, returned);
    await Review.updateOne({ _id: graded._id }, { grade: 8 });
    asTeacher();

    const queue = await getUngradedReviews();

    expect(queue.map((r) => r._id)).toEqual([
      older._id.toString(),
      newer._id.toString(),
    ]);
    expect(queue[0]).toMatchObject({
      comment: older.comment,
      guide: { _id: guide._id.toString(), title: guide.title },
      return: {
        _id: returned._id.toString(),
        projectName: returned.projectName,
      },
      reviewer: { _id: reviewer._id.toString(), name: reviewer.name },
      returnOwner: { _id: author._id.toString(), name: author.name },
    });
    expect(await getUngradedReviewCount()).toBe(2);
  });

  it("leaves out reviews whose guide or reviewer no longer exists, in list and count alike", async () => {
    const author = await createDummyUser();
    const reviewer = await createDummyUser();
    const guide = await createDummyGuide();
    const returned = await createDummyReturn(author, guide);
    const kept = await createDummyReview(reviewer, guide, returned);
    // No owner given: the helper invents an id that matches no user.
    await createDummyReview(undefined, guide, returned);
    const orphan = await createDummyReview(await createDummyUser(), guide, returned);
    await Review.updateOne(
      { _id: orphan._id },
      { guide: new mongoose.Types.ObjectId() }
    );
    asTeacher();

    expect((await getUngradedReviews()).map((r) => r._id)).toEqual([
      kept._id.toString(),
    ]);
    expect(await getUngradedReviewCount()).toBe(1);
  });
});
