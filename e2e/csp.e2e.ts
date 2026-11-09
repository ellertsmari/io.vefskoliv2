import { expect, test, type Page } from "@playwright/test";
import { IDS, storageState, type Role } from "./users";

/*
 * The app sends its Content-Security-Policy as "report only" (next.config.mjs):
 * the browser applies nothing, it only says what the policy WOULD have blocked.
 * This walks the pages as a visitor, a student and a teacher and fails on
 * anything the browser reports, so the policy can be enforced with confidence.
 * Once it is enforced the same test keeps guarding it: an enforced violation
 * fires the same event.
 *
 * What this cannot see: pages that need data the seed does not have (a group
 * project, a showcase entry), images students host elsewhere, and anything a
 * person only reaches by clicking further than this does.
 */

type Violation = { page: string; directive: string; blocked: string };

const collectViolations = async (page: Page) => {
  const violations: Violation[] = [];
  await page.exposeFunction("__reportCsp", (violation: Violation) => {
    violations.push(violation);
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __reportCsp: (v: unknown) => void }).__reportCsp({
        page: location.pathname,
        directive: event.effectiveDirective,
        blocked: event.blockedURI || event.sourceFile || "inline",
      });
    });
  });
  return violations;
};

const visit = async (page: Page, paths: string[]) => {
  for (const path of paths) {
    await page.goto(path);
    // Give late scripts and images a moment, without waiting for the landing
    // page's video to finish streaming (it never goes idle).
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
  }
};

const PUBLIC_PAGES = ["/", "/guides", `/guides/${IDS.returnGuide}`, "/showcase", "/signin"];

const SIGNED_IN_PAGES = [
  "/LMS/dashboard",
  "/guides",
  `/guides/${IDS.returnGuide}`,
  `/guides/${IDS.quizGuide}`,
  "/LMS/groups",
  "/LMS/resources",
  "/halloffame",
  "/LMS/people",
  "/LMS/calendar",
  "/LMS/docs",
];

const TEACHER_PAGES = [
  ...SIGNED_IN_PAGES,
  "/LMS/edit-guides",
  `/LMS/edit-guides/${IDS.returnGuide}`,
  `/LMS/edit-guides/${IDS.quizGuide}`,
  "/LMS/reports",
  "/LMS/analytics",
];

test.describe("content security policy", () => {
  test("the report-only policy is actually being sent", async ({ request }) => {
    const response = await request.get("/guides");
    const headers = response.headers();
    expect(
      headers["content-security-policy-report-only"] ??
        headers["content-security-policy"]
    ).toContain("default-src 'self'");
  });

  test("a visitor's pages stay inside the policy", async ({ page }) => {
    const violations = await collectViolations(page);
    await visit(page, PUBLIC_PAGES);
    expect(violations).toEqual([]);
  });

  for (const [role, pages] of [
    ["anna", SIGNED_IN_PAGES],
    ["teacher", TEACHER_PAGES],
  ] as Array<[Role, string[]]>) {
    test.describe(`signed in as ${role}`, () => {
      test.use({ storageState: storageState(role) });

      test("the pages stay inside the policy", async ({ page }) => {
        const violations = await collectViolations(page);
        await visit(page, pages);

        // The exercise runner and the view-as menu add markup after load.
        if (role === "anna") {
          await page.goto(`/guides/${IDS.quizGuide}`);
          await page.getByRole("button", { name: "Start the exercise" }).click();
          await expect(page.getByText("Question 1 of 2")).toBeVisible();
        }
        expect(violations).toEqual([]);
      });
    });
  }
});
