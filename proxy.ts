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
  // Static assets in /public must be excluded: the landing page is public, but
  // its assets would otherwise be redirected to /signin for logged-out visitors
  // (the hero video was served a 307 to the sign-in page instead of an mp4).
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|mp4|webm|mp3|woff|woff2|ttf|otf|pdf)$).*)",
  ],
};
