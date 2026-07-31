import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product/question images are submitted through server actions. The 1 MB
      // default rejects ordinary phone photos with an opaque 413 before any of
      // our validation runs. 4 MB keeps headroom under Vercel's 4.5 MB request
      // ceiling; the admin forms also downscale images client-side first.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
