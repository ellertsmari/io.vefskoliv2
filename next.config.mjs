/** @type {import('next').NextConfig} */
const nextConfig = {
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
  experimental: {
    serverActions: {
      // Uploaded images are submitted inline as data URLs (up to 3 × ~650 KB
      // per submission, see app/utils/imageUpload.ts).
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
