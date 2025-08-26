import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  // First, check if this is an authentication-related request
  const authMiddleware = NextAuth(authConfig).auth;
  
  // Handle custom routing for page requests
  const url = request.nextUrl.clone();

  // Check if the path starts with `/` and rewrite to act as if it's under `/pages`
  // For example, `/guides` would be rewritten to `/pages/guides/page.tsx`
  if (url.pathname.startsWith("/")) {
    url.pathname = `/pages${url.pathname}/`; // Adjust this based on your directory structure
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
