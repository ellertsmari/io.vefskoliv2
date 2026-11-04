/**
 * @jest-environment node
 *
 * Every top-level route is either public or behind the login, on purpose.
 *
 * The proxy only redirects logged-out visitors from PROTECTED_ROUTES, so
 * that an address which does not exist gets a real 404 rather than the
 * sign-in page. The flip side: a new top-level folder under app/ with a
 * page in it would be open to everyone unless it is listed. This test makes
 * that a decision instead of an accident.
 */
import fs from "node:fs";
import path from "node:path";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "../../auth.config";

const APP = path.join(process.cwd(), "app");
const ROUTE_FILE = /^(page|route)\.(tsx?|jsx?)$/;

/** API routes are outside the proxy matcher and check access themselves. */
const OUTSIDE_PROXY = new Set(["api"]);

const containsRoute = (dir: string): boolean =>
  fs.readdirSync(dir, { withFileTypes: true }).some((entry) =>
    entry.isDirectory()
      ? containsRoute(path.join(dir, entry.name))
      : ROUTE_FILE.test(entry.name)
  );

const topLevelRoutes = fs
  .readdirSync(APP, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  // Private folders (_x) are not routes; route groups ((x)) would need care
  // and there are none yet.
  .filter((name) => !name.startsWith("_") && !OUTSIDE_PROXY.has(name))
  .filter((name) => containsRoute(path.join(APP, name)));

const publicSegments = PUBLIC_ROUTES.map((route) => route.replace(/\/$/, ""));

describe("route access", () => {
  it("finds the app's routes", () => {
    expect(topLevelRoutes).toEqual(expect.arrayContaining(["LMS", "guides"]));
  });

  it.each(topLevelRoutes)("/%s is either public or protected", (name) => {
    const route = `/${name}`;
    const isPublic = publicSegments.includes(route);
    const isProtected = PROTECTED_ROUTES.includes(route);
    expect({ route, isPublic, isProtected }).toEqual(
      expect.objectContaining({ isPublic: !isProtected })
    );
  });

  it("has no route group folders the check would miss", () => {
    const groups = fs
      .readdirSync(APP, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("("));
    expect(groups.map((entry) => entry.name)).toEqual([]);
  });
});
