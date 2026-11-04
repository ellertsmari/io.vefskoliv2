/**
 * @jest-environment node
 */
import { isPublicPathname, requiresSignIn } from "../../auth.config";

describe("isPublicPathname", () => {
  it("lets logged-out visitors open static handouts and their assets", () => {
    expect(isPublicPathname("/handouts/hi-git/index.html")).toBe(true);
    expect(isPublicPathname("/handouts/hi-git/style.css")).toBe(true);
    expect(isPublicPathname("/handouts/hi-git/script.js")).toBe(true);
  });

  it("does not open look-alike paths", () => {
    expect(isPublicPathname("/handoutsecret")).toBe(false);
  });

  it("lets crawlers read robots.txt and the sitemap", () => {
    expect(isPublicPathname("/robots.txt")).toBe(true);
    expect(isPublicPathname("/sitemap.xml")).toBe(true);
  });

  it("keeps the LMS behind sign-in", () => {
    expect(isPublicPathname("/LMS/dashboard")).toBe(false);
    expect(isPublicPathname("/")).toBe(true);
  });
});

describe("requiresSignIn", () => {
  it("sends logged-out visitors from protected routes to sign-in", () => {
    expect(requiresSignIn("/LMS")).toBe(true);
    expect(requiresSignIn("/LMS/dashboard")).toBe(true);
    expect(requiresSignIn("/halloffame")).toBe(true);
    expect(requiresSignIn("/lti/content")).toBe(true);
  });

  it("leaves addresses that do not exist to the 404 page", () => {
    expect(requiresSignIn("/llms.txt")).toBe(false);
    expect(requiresSignIn("/this-does-not-exist")).toBe(false);
    expect(requiresSignIn("/LMSsomething")).toBe(false);
  });

  it("never asks for sign-in on public pages, the favicon included", () => {
    expect(requiresSignIn("/")).toBe(false);
    expect(requiresSignIn("/icon")).toBe(false);
    expect(requiresSignIn("/guides/abc")).toBe(false);
    expect(requiresSignIn("/showcase")).toBe(false);
  });
});
