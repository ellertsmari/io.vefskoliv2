/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next dev` and `next build` both write to .next by default, so running a
  // build while a dev server is up overwrites the manifests that server is
  // reading and it starts returning 404s for routes that plainly exist. Set
  // NEXT_DIST_DIR to build into a scratch directory instead:
  //   NEXT_DIST_DIR=.next-verify yarn build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  compiler: {
    styledComponents: true,
  },
  // Kept out of the bundle and required at runtime instead. The QuickJS
  // single-file variant embeds its WebAssembly as one very large string
  // literal, which the bundler mangles into invalid output ("octal escape
  // sequences are not allowed in template strings"); the TypeScript compiler is
  // simply too big to be worth inlining. Both are server-only — see
  // app/utils/codeRunner.ts.
  serverExternalPackages: [
    "typescript",
    "quickjs-emscripten-core",
    "@jitl/quickjs-singlefile-cjs-release-sync",
  ],
  // The exercise grader type-checks student code, and the TypeScript compiler
  // reads its standard library from disk at runtime. File tracing follows
  // imports, not files opened later, so lib.*.d.ts was missing in production:
  // `Array` was undefined, `Person[]` degraded to `{}`, and correct
  // submissions were rejected with errors about `{}` having no `length`.
  //
  // The key MUST be a glob. A literal route key ("/guides/[id]") matches
  // nothing and fails silently — verify with:
  //   jq '[.files[]|select(test("typescript/lib/lib."))]|length' \
  //     '.next/server/app/guides/[id]/page.js.nft.json'
  outputFileTracingIncludes: {
    "/guides/**": ["./node_modules/typescript/lib/**"],
  },
  // Uploaded images live in Vercel Blob and are referenced by URL, so
  // next/image can finally optimize them (resize, modern formats) instead of
  // being handed an un-sized data URL and forced to pass it through.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Images no longer travel through server actions — the browser uploads
      // them straight to Blob and submits only the URL. The raised limit stays
      // for records still holding a legacy inline data URL, which are re-sent
      // as-is whenever such a record is saved without re-uploading its image.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
