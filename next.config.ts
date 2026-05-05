import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Incluir pasta provas no output do build
  outputFileTracingIncludes: {
    "/api/provas/examples": ["./provas/**/*"],
  },
};

export default nextConfig;
