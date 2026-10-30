/**
 * @jest-environment node
 */
import { isPublicPathname } from "../../auth.config";

describe("isPublicPathname", () => {
  it("lets logged-out visitors open static handouts and their assets", () => {
    expect(isPublicPathname("/handouts/hi-git/index.html")).toBe(true);
    expect(isPublicPathname("/handouts/hi-git/style.css")).toBe(true);
    expect(isPublicPathname("/handouts/hi-git/script.js")).toBe(true);
  });

  it("does not open look-alike paths", () => {
    expect(isPublicPathname("/handoutsecret")).toBe(false);
  });

  it("keeps the LMS behind sign-in", () => {
    expect(isPublicPathname("/LMS/dashboard")).toBe(false);
    expect(isPublicPathname("/")).toBe(true);
  });
});
