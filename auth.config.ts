import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes that don't require authentication
      const publicRoutes = ['/guides', '/signin', '/'];
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

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
