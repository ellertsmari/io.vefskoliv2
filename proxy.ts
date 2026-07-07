import NextAuth from "next-auth";
import { authConfig, isPublicPathname } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Renamed from the deprecated `middleware` file convention to `proxy` (Next.js
// 16). Behaviour is unchanged except that proxy runs on the Node.js runtime
// instead of Edge. Our route protection uses the edge-safe `authConfig`
// (JWT session, no DB adapter), so it behaves the same on Node.js.
//
// Note: when `auth()` wraps a custom function, the `authorized` callback's
// return value is NOT enforced automatically — the redirect must happen here.
export default auth(function proxy(request) {
  const { pathname } = request.nextUrl;

  if (!isPublicPathname(pathname) && !request.auth?.user) {
    const signIn = new URL("/signin", request.nextUrl);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  // Pass the pathname to the layout via headers so it can determine public routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

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
