import { expect, test } from "@playwright/test";
import { IDS, storageState } from "./users";

/*
 * The paths that must never break: a visitor can read the guides, a student
 * can hand in a project and work through an exercise, a teacher reaches the
 * teaching tools. Each test checks what a person would see, not how the page
 * is built.
 */

test.describe("a visitor", () => {
  test("sees the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("video")).toBeVisible();
    await expect(page).toHaveTitle(/Vefskólinn/);
  });

  test("can read the guide list and a guide without an account", async ({ page }) => {
    await page.goto("/guides");
    await expect(page.getByText("E2E Return Guide")).toBeVisible();
    await expect(page.getByText("E2E Quiz Guide")).toBeVisible();

    await page.goto(`/guides/${IDS.returnGuide}`);
    await expect(
      page.getByText("What E2E Return Guide asks you to build.").first()
    ).toBeVisible();
  });

  test("is sent to sign in for anything behind the login", async ({ page }) => {
    await page.goto("/LMS/dashboard");
    await expect(page).toHaveURL(/\/signin\?callbackUrl=/);
  });

  test("gets a real 404 for a guide that does not exist", async ({ page }) => {
    const response = await page.goto("/guides/000000000000000000000000");
    expect(response?.status()).toBe(404);
  });
});

test.describe("a student", () => {
  test.use({ storageState: storageState("anna") });

  test("sees their guides on the dashboard", async ({ page }) => {
    await page.goto("/LMS/dashboard");
    await expect(page.getByText("Continue Learning")).toBeVisible();
    await expect(page.getByText("E2E Return Guide")).toBeVisible();
  });

  test("hands in a project", async ({ page }) => {
    await page.goto(`/guides/${IDS.returnGuide}`);
    await page.locator('input[name="projectUrl"]').fill("https://github.com/e2e/project");
    await page.locator('input[name="liveVersion"]').fill("https://e2e.github.io/project");
    await page.locator('[name="projectName"]').fill("E2E project");
    await page.locator('[name="comment"]').fill("Handed in by the browser test.");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("Return submitted!")).toBeVisible();

    // And it is still handed in after a reload: it reached the database.
    await page.goto(`/guides/${IDS.returnGuide}`);
    await expect(page.getByText("Returned ✓")).toBeVisible();
    await expect(page.getByText("https://github.com/e2e/project")).toBeVisible();
  });

  test("answers an exercise question and gets it marked", async ({ page }) => {
    await page.goto(`/guides/${IDS.quizGuide}`);
    await page.getByRole("button", { name: "Start the exercise" }).click();
    await expect(page.getByText("Question 1 of 2")).toBeVisible();

    await page.getByText("Right answer 1").click();
    await page.getByRole("button", { name: "Check", exact: true }).click();

    // The explanation is only shown for a correct answer.
    await expect(page.getByText("Explanation 1")).toBeVisible();
    await expect(page.getByText(/Your score 5\/10/)).toBeVisible();
  });
});

test.describe("a teacher", () => {
  test.use({ storageState: storageState("teacher") });

  test("gets the teacher dashboard with the grading queue", async ({ page }) => {
    await page.goto("/LMS/dashboard");
    await expect(page.getByText("Teacher dashboard", { exact: false })).toBeVisible();
    await expect(
      page.getByText("Everything is graded — nothing waiting")
    ).toBeVisible();
  });

  test("reaches the guide editor and the people page", async ({ page }) => {
    await page.goto("/LMS/edit-guides");
    await expect(page.getByRole("heading", { name: "E2E Return Guide" })).toBeVisible();
    await expect(page.getByText("Auto-graded")).toBeVisible();

    await page.goto("/LMS/people");
    await expect(page.getByText("Anna Student")).toBeVisible();
    await expect(page.getByText("Bjorn Student")).toBeVisible();
  });

  test("opens the other teaching pages without an error", async ({ page }) => {
    for (const path of ["/LMS/reports", "/LMS/groups", "/LMS/calendar", "/LMS/analytics"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByText("Something went wrong"), path).toHaveCount(0);
    }
  });

  test("can view the site as a student and come back", async ({ page }) => {
    await page.goto("/LMS/dashboard");
    await page.getByRole("button", { name: "View as user" }).click();
    await page.getByText("Anna Student").click();

    await expect(page.getByText("Viewing as")).toBeVisible();
    await expect(page.getByText("Here's what you need to focus on today")).toBeVisible();

    await page.getByRole("button", { name: "Exit student view" }).click();
    await expect(page.getByText("Teacher dashboard", { exact: false })).toBeVisible();
  });
});
