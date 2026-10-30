/**
 * @jest-environment node
 */
import { getAnalyticsHeadline } from "serverActions/getAnalyticsHeadline";
import { getAnalyticsHeadline as readHeadline } from "../../app/lib/analytics/stats";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("../../app/lib/analytics/stats", () => ({
  getAnalyticsHeadline: jest.fn(),
}));

const HEADLINE = { days: 7, visitors: 3, views: 5, collectingSince: "2026-10-20" };

describe("getAnalyticsHeadline", () => {
  beforeEach(() => jest.mocked(readHeadline).mockResolvedValue(HEADLINE));
  afterEach(() => jest.clearAllMocks());

  it("gives teachers the numbers", async () => {
    jest.mocked(auth).mockResolvedValue({ user: { role: "teacher" } } as never);
    expect(await getAnalyticsHeadline()).toEqual(HEADLINE);
  });

  it("gives students and anonymous callers nothing, without reading", async () => {
    jest.mocked(auth).mockResolvedValue({ user: { role: "user" } } as never);
    expect(await getAnalyticsHeadline()).toBeNull();
    jest.mocked(auth).mockResolvedValue(null as never);
    expect(await getAnalyticsHeadline()).toBeNull();
    expect(readHeadline).not.toHaveBeenCalled();
  });

  it("returns null rather than throwing when the read fails", async () => {
    jest.mocked(auth).mockResolvedValue({ user: { role: "teacher" } } as never);
    jest.mocked(readHeadline).mockRejectedValue(new Error("db down"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(await getAnalyticsHeadline()).toBeNull();
    log.mockRestore();
  });
});
