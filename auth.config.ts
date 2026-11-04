import type { NextAuthConfig } from "next-auth";

// Routes that don't require authentication:
// - /judge/<token> is for external judges — the token is the credential
// - /showcase is the public project showcase students link from CVs
// - /handouts/ holds static pages in public/handouts, shared by unlisted link
//   with people who have no account (e.g. the Hyper Island team's git guide)
// - /robots.txt and /sitemap.xml are for crawlers, which never log in
// '/' must match exactly — with startsWith it would make every route public.
const PUBLIC_ROUTES = [
  "/guides",
  "/signin",
  "/judge",
  "/showcase",
  "/handouts/",
  "/robots.txt",
  "/sitemap.xml",
];

export const isPublicPathname = (pathname: string): boolean =>
  pathname === "/" ||
  pathname === "/icon" ||
  PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

/**
 * The route segments behind the login. Only these send a logged-out visitor
 * to /signin. Any other address is left to Next.js, so one that does not
 * exist gets a real 404 instead of a sign-in page that crawlers would file
 * under that address.
 *
 * __tests__/architecture/routeAccess.test.ts fails when a new top-level route
 * is in neither this list nor PUBLIC_ROUTES, so nothing becomes public by
 * accident.
 */
export const PROTECTED_ROUTES = ["/LMS", "/halloffame", "/lti"];

export const requiresSignIn = (pathname: string): boolean =>
  !isPublicPathname(pathname) &&
  PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

export { PUBLIC_ROUTES };

export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Default redirect after login
      return `${baseUrl}/LMS/dashboard`;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // Unauthenticated users are sent to the login page only from a
      // protected route; elsewhere the page itself (or its 404) is shown.
      return isLoggedIn || !requiresSignIn(nextUrl.pathname);
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
