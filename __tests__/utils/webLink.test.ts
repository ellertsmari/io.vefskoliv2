import { isWebLink, webLink, WEB_LINK_MAX_LENGTH } from "utils/webLink";

describe("webLink", () => {
  it.each([
    "https://vefskolinn.is",
    "http://localhost:3000/guides",
    "https://github.com/you/project?tab=readme#top",
    "HTTPS://EXAMPLE.COM",
  ])("accepts the web address %s", (value) => {
    expect(isWebLink(value)).toBe(true);
    expect(webLink().safeParse(value).success).toBe(true);
  });

  // zod's .url() alone accepts every one of the first five.
  it.each([
    "javascript:alert(document.cookie)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "vefskolinn.is",
    "not a link",
    "",
  ])("rejects %s", (value) => {
    expect(isWebLink(value)).toBe(false);
    expect(webLink().safeParse(value).success).toBe(false);
  });

  it("trims the value it returns", () => {
    expect(webLink().parse("  https://vefskolinn.is  ")).toBe("https://vefskolinn.is");
  });

  it("caps the length", () => {
    const long = "https://vefskolinn.is/" + "x".repeat(WEB_LINK_MAX_LENGTH);
    expect(webLink().safeParse(long).success).toBe(false);
  });

  it("reports the caller's message for a link that is not a web address", () => {
    const parsed = webLink("Use a real link").safeParse("javascript:alert(1)");
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].message).toBe("Use a real link");
  });
});

describe("webLink error reporting", () => {
  it("reports a bad value once, not once per check", () => {
    const parsed = webLink().safeParse("");
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues).toHaveLength(1);
  });
});
