import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // storage.ts reads the seed JSON via a computed path; make sure the tracer
  // ships it with every serverless function.
  outputFileTracingIncludes: {
    "/*": ["./src/data/**/*"],
  },
};

export default nextConfig;
