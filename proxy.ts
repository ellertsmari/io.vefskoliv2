import NextAuth from "next-auth";
import { authConfig, isPublicPathname } from "./auth.config";
import { NextResponse, after } from "next/server";
import {
  normalizePath,
  shouldRecordHit,
  snapshotRequest,
} from "./app/utils/analytics";

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

  // Public traffic analytics (teachers read it at /LMS/analytics). Logged-in
  // requests are never recorded, so no student is ever measured. Checked
  // before the sign-in redirect so a crawler's request for robots.txt is
  // counted even while that file still redirects. The recorder is imported
  // lazily and runs after the response is sent, so it adds nothing to the
  // page's time and keeps mongoose out of requests that don't record.
  const path = normalizePath(pathname);
  if (
    shouldRecordHit({
      method: request.method,
      pathname: path,
      headers: request.headers,
      isLoggedIn: Boolean(request.auth?.user),
    })
  ) {
    const hit = snapshotRequest(path, request.nextUrl, request.headers);
    after(async () => {
      const { recordPageview } = await import(
        "./app/lib/analytics/recordPageview"
      );
      await recordPageview(hit);
    });
  }

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
