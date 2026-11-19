
/**
 * @jest-environment node
 */

import {
  connect,
  clearDatabase,
  closeDatabase,
  createDummyUser,
} from "../__mocks__/mongoHandler";

import { auth } from "../../auth";
import { Portfolio } from "models/portfolio";
import { getMyPortfolio } from "serverActions/portfolio/getMyPortfolio";
import { mockPortfolioContent } from "utils/portfolio/mockPortfolio";
import { ErrorMessages } from "utils/errors";

// Replace the real login function during tests
jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("getMyPortfolio", () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it("rejects students who are not logged in", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const result = await getMyPortfolio();

    expect(result).toMatchObject({
      success: false,
      message: ErrorMessages.NOT_LOGGED_IN,
    });
  });

  it("rejects an invalid student ID", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "invalid-id" },
    });

    const result = await getMyPortfolio();

    expect(result).toMatchObject({
      success: false,
      message: ErrorMessages.NOT_AUTHORIZED,
    });
  });

  it("returns null if the student has no portfolio", async () => {
    const student = await createDummyUser();

    (auth as jest.Mock).mockResolvedValue({
      user: { id: student._id.toString() },
    });

    const result = await getMyPortfolio();

    expect(result).toMatchObject({
      success: true,
      data: null,
    });
  });

  it("returns the logged-in student's stored portfolio", async () => {
    const student = await createDummyUser();

    (auth as jest.Mock).mockResolvedValue({
      user: { id: student._id.toString() },
    });

    const publishedAt = new Date(
      "2026-11-05T12:00:00.000Z"
    );

    await Portfolio.create({
      studentId: student._id,
      slug: "anna-jonsdottir",
      visibility: "public",
      publishedAt,
      content: mockPortfolioContent,
    });

    const result = await getMyPortfolio();

    expect(result).toMatchObject({
      success: true,
      data: {
        slug: "anna-jonsdottir",
        visibility: "public",
        publishedAt: publishedAt.toISOString(),
        content: {
          profile: {
            name: mockPortfolioContent.profile.name,
          },
          availability: {
            availableFrom:
              mockPortfolioContent.availability.availableFrom.toISOString(),
          },
        },
      },
    });
  });
});
