/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  experimental: {
    serverActions: {
      // Uploaded images are submitted inline as data URLs (up to 3 × ~650 KB
      // per submission, see app/utils/imageUpload.ts).
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
