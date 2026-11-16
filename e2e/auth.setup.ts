import { expect, test as setup } from "@playwright/test";
import { PASSWORD, USERS, storageState, type Role } from "./users";

// Sign in once per user and keep the cookies. Signing in before every test
// would run into the login rate limit, which is doing its job.
for (const role of Object.keys(USERS) as Role[]) {
  setup(`sign in as ${role}`, async ({ page }) => {
    await page.goto("/signin");
    await page.locator('input[name="email"]').fill(USERS[role].email);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/LMS\/dashboard/);
    await page.context().storageState({ path: storageState(role) });
  });
}
