import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Renamed from the deprecated `middleware` file convention to `proxy` (Next.js
// 16). Behaviour is unchanged except that proxy runs on the Node.js runtime
// instead of Edge. Our route protection uses the edge-safe `authConfig`
// (JWT session, no DB adapter), so it behaves the same on Node.js.
export default auth(function proxy(request: NextRequest) {
  // Pass the pathname to the layout via headers so it can determine public routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
