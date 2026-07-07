import type { NextAuthConfig } from "next-auth";

// Routes that don't require authentication:
// - /judge/<token> is for external judges — the token is the credential
// - /showcase is the public project showcase students link from CVs
// '/' must match exactly — with startsWith it would make every route public.
const PUBLIC_ROUTES = ["/guides", "/signin", "/judge", "/showcase"];

export const isPublicPathname = (pathname: string): boolean =>
  pathname === "/" ||
  PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

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
      const { pathname } = nextUrl;

      const isPublicRoute = isPublicPathname(pathname);

      if (isPublicRoute) {
        return true;
      }

      if (isLoggedIn) {
        return true;
      }

      return false; // Redirect unauthenticated users to login page
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
