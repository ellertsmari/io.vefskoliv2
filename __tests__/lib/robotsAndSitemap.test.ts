/**
 * @jest-environment node
 */
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";
import { getPublicGuides } from "serverActions/getPublicGuides";

jest.mock("serverActions/getPublicGuides", () => ({
  getPublicGuides: jest.fn(),
}));

describe("robots.txt", () => {
  it("opens the site, closes the login side and points at the sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://io.vefskoli.is/sitemap.xml");
    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect((result.rules as { disallow: string[] }).disallow).toContain("/LMS/");
  });
});

describe("sitemap.xml", () => {
  it("lists the public pages and every guide, with dates where they are usable", async () => {
    (getPublicGuides as jest.Mock).mockResolvedValue([
      { _id: "5f13205ab279dc27c467ca56", updatedAt: "2026-09-01T10:00:00.000Z" },
      // Hand-imported: no dates at all.
      { _id: "65046cf9e886e4185644aab9" },
    ]);

    const urls = await sitemap();

    expect(urls.map((u) => u.url)).toEqual([
      "https://io.vefskoli.is",
      "https://io.vefskoli.is/guides",
      "https://io.vefskoli.is/showcase",
      "https://io.vefskoli.is/guides/5f13205ab279dc27c467ca56",
      "https://io.vefskoli.is/guides/65046cf9e886e4185644aab9",
    ]);
    expect(urls[3].lastModified).toBe("2026-09-01T10:00:00.000Z");
    expect(urls[4]).not.toHaveProperty("lastModified");
  });

  it("still lists the public pages when the guides can't be read", async () => {
    (getPublicGuides as jest.Mock).mockResolvedValue(null);
    expect(await sitemap()).toHaveLength(3);
  });
});
